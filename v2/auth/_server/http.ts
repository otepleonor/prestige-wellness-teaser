import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  AuthorizationError,
  isAuthorizationError,
  type AuthenticatedPrincipal,
  type AuthorizationErrorCode,
} from "@galley/application";
import { sanitizeLogMessage } from "@galley/auth";
import type { AuthRuntime } from "./runtime";

const noStoreHeaders = {
  "cache-control": "no-store",
  pragma: "no-cache",
  "x-content-type-options": "nosniff",
} as const;

export function json(
  status: number,
  body: unknown,
  headers: HeadersInit = {},
): Response {
  const merged = new Headers(headers);
  for (const [name, value] of Object.entries(noStoreHeaders))
    merged.set(name, value);
  merged.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers: merged });
}

const statusByCode: Readonly<Record<AuthorizationErrorCode, number>> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  REAUTHENTICATION_REQUIRED: 403,
  TENANT_UNAVAILABLE: 403,
  VALIDATION_FAILED: 400,
  INVITATION_INVALID: 400,
  ALREADY_MEMBER: 409,
  LAST_OWNER: 409,
  MAIL_UNAVAILABLE: 502,
  RATE_LIMITED: 429,
};

/** Maps domain failures to uniform, non-disclosing responses; anything unexpected is a generic 500. */
export function problem(error: unknown): Response {
  if (isAuthorizationError(error))
    return json(statusByCode[error.code], { error: { code: error.code } });
  // Fail closed without leaking internals; the sanitized message never carries tokens or addresses.
  console.error(
    `[auth] unexpected failure: ${sanitizeLogMessage(error instanceof Error ? error.message : error)}`,
  );
  return json(500, { error: { code: "INTERNAL" } });
}

export type RouteContext<Params extends Record<string, string>> = {
  params: Promise<Params>;
};

/** Verifies the session and returns the principal; the only way a route obtains an identity. */
export function requirePrincipal(
  runtime: AuthRuntime,
  request: Request,
): Promise<AuthenticatedPrincipal> {
  return runtime.authorization.authenticate(request.headers);
}

const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * CSRF defense for cookie-authenticated state changes: exact Origin allow-list (absence is rejected, since
 * browsers always send Origin on non-GET requests), Fetch Metadata, and a per-session token that a cross-site
 * page cannot read. JSON-only bodies additionally force a CORS preflight that is never granted.
 */
export function assertTrustedMutation(
  runtime: AuthRuntime,
  request: Request,
  principal: AuthenticatedPrincipal,
): void {
  if (!mutatingMethods.has(request.method)) return;
  const origin = request.headers.get("origin");
  if (!origin || !runtime.trustedOrigins.has(origin))
    throw new AuthorizationError("FORBIDDEN");
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") throw new AuthorizationError("FORBIDDEN");
  const supplied = request.headers.get("x-galley-csrf") ?? "";
  if (!constantTimeEqual(supplied, runtime.csrfTokenFor(principal.sessionId)))
    throw new AuthorizationError("FORBIDDEN");
}

const maxBodyBytes = 16 * 1024;

/** Strict, size-bounded JSON ingress. Unknown keys are rejected so a body can never smuggle context. */
export async function readJson<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<z.infer<Schema>> {
  const type = request.headers.get("content-type") ?? "";
  if (!/^application\/json(\s*;|$)/i.test(type))
    throw new AuthorizationError("VALIDATION_FAILED");
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBodyBytes)
    throw new AuthorizationError("VALIDATION_FAILED");
  const text = await request.text();
  if (text.length > maxBodyBytes)
    throw new AuthorizationError("VALIDATION_FAILED");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new AuthorizationError("VALIDATION_FAILED");
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new AuthorizationError("VALIDATION_FAILED");
  return parsed.data;
}
