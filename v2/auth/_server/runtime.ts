import { createHmac, hkdfSync } from "node:crypto";
import { Pool } from "pg";
import {
  createAuthorization,
  createStaffAccess,
  hashInvitationToken,
  isWellFormedInvitationToken,
  type Authorization,
  type Clock,
  type StaffAccess,
} from "@galley/application";
import {
  assertRestrictedRole,
  createAuthPool,
  createBetterAuthSessionPort,
  createGalleyAuth,
  createPostgresInvitationDirectory,
  createPostgresMembershipDirectory,
  createPostgresTenantStores,
  createSmtpMailer,
  parseAuthEnvironment,
  type AuthConfig,
  type AuthMailer,
  type GalleyAuth,
} from "@galley/auth";
import { tenantUnitOfWork } from "@galley/db";

export interface AuthRuntime {
  readonly config: AuthConfig;
  readonly auth: GalleyAuth;
  readonly authorization: Authorization;
  readonly staff: StaffAccess;
  /** Exact origins allowed to submit state-changing requests. */
  readonly trustedOrigins: ReadonlySet<string>;
  /** Per-session anti-CSRF token: an HMAC of the server-side session id under a derived key. */
  csrfTokenFor(sessionId: string): string;
  close(): Promise<void>;
}

export interface RuntimeInputs {
  readonly config: AuthConfig;
  /** Business pool: the non-owner runtime role. Used only through the tenant unit of work. */
  readonly runtimePool: Pool;
  /** Identity pool: the dedicated auth login role with `search_path` pinned to the identity schema. */
  readonly authPool: Pool;
  readonly mailer: AuthMailer;
  readonly clock?: Clock;
}

/**
 * Pure composition: wires identity, authorization and the tenant unit of work together. This is the single
 * place where concrete adapters meet application services; nothing else constructs a tenant authority.
 */
export function createAuthRuntime(inputs: RuntimeInputs): AuthRuntime {
  const { config, runtimePool, authPool, mailer } = inputs;
  const invitations = createPostgresInvitationDirectory(authPool, {
    tenantSchema: config.tenantSchema,
  });
  const auth = createGalleyAuth({
    config,
    pool: authPool,
    mailer,
    invitationForSignUp: async (token) =>
      isWellFormedInvitationToken(token)
        ? invitations.resolve(hashInvitationToken(token))
        : null,
  });
  const stores = createPostgresTenantStores({
    tenantSchema: config.tenantSchema,
  });
  const authorization = createAuthorization({
    sessions: createBetterAuthSessionPort(auth),
    memberships: createPostgresMembershipDirectory(authPool, {
      tenantSchema: config.tenantSchema,
    }),
    actors: stores.actors,
    unit: tenantUnitOfWork(runtimePool),
    ...(inputs.clock ? { clock: inputs.clock } : {}),
  });
  const staff = createStaffAccess({
    authorization,
    store: stores.staff,
    invitations,
    mailer,
    invitationUrl: (token) =>
      `${config.baseUrl}/auth/accept-invitation?token=${encodeURIComponent(token)}`,
  });
  const csrfKey = Buffer.from(
    hkdfSync("sha256", config.secret, "", "galley/csrf/v1", 32),
  );
  return {
    config,
    auth,
    authorization,
    staff,
    trustedOrigins: new Set([config.baseUrl, ...config.trustedOrigins]),
    csrfTokenFor: (sessionId) =>
      createHmac("sha256", csrfKey).update(sessionId).digest("base64url"),
    async close() {
      await Promise.all([runtimePool.end(), authPool.end()]);
    },
  };
}

function required(
  env: Readonly<Record<string, string | undefined>>,
  name: string,
): string {
  const value = env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

/** Builds the production runtime from the environment and refuses to start with an over-privileged role. */
export async function createAuthRuntimeFromEnv(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<AuthRuntime> {
  const config = parseAuthEnvironment(env);
  const runtimePool = new Pool({
    connectionString: required(env, "DATABASE_RUNTIME_URL"),
    max: 10,
    application_name: "galley-web",
    options:
      "-c statement_timeout=15000 -c idle_in_transaction_session_timeout=15000",
  });
  const authPool = createAuthPool(
    required(env, "DATABASE_AUTH_URL"),
    config.authSchema,
    { applicationName: "galley-web-auth" },
  );
  try {
    await assertRestrictedRole(runtimePool, "Runtime");
    await assertRestrictedRole(authPool, "Auth");
  } catch (error) {
    await Promise.allSettled([runtimePool.end(), authPool.end()]);
    throw error;
  }
  return createAuthRuntime({
    config,
    runtimePool,
    authPool,
    mailer: createSmtpMailer({
      url: config.mail.smtpUrl,
      from: config.mail.from,
    }),
  });
}

const globalKey = Symbol.for("galley.web.authRuntime");

/** Lazily created singleton; survives dev hot reloads. A failed start is not cached. */
export function getAuthRuntime(): Promise<AuthRuntime> {
  const holder = globalThis as unknown as Record<
    symbol,
    Promise<AuthRuntime> | undefined
  >;
  let runtime = holder[globalKey];
  if (!runtime) {
    runtime = createAuthRuntimeFromEnv().catch((error: unknown) => {
      holder[globalKey] = undefined;
      throw error;
    });
    holder[globalKey] = runtime;
  }
  return runtime;
}
