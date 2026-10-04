import { z } from "zod";
import { decide, permissions } from "@galley/application";
import type { AuthenticatedPrincipal } from "@galley/application";
import { createAuthApiHandler } from "./auth-api";
import {
  assertTrustedMutation,
  json,
  problem,
  readJson,
  requirePrincipal,
  type RouteContext,
} from "./http";
import type { AuthRuntime } from "./runtime";

const roleSchema = z.enum(["owner", "admin", "staff"]);
const inviteBody = z.strictObject({
  email: z.email().max(254),
  role: roleSchema,
});
const roleBody = z.strictObject({ role: roleSchema });
const acceptBody = z.strictObject({ token: z.string().min(1).max(200) });

type Params = Record<string, string>;
type Handle<P extends Params> = (
  runtime: AuthRuntime,
  principal: AuthenticatedPrincipal,
  request: Request,
  params: P,
) => Promise<Response>;

/**
 * Builds the route handlers for the auth area around a lazily resolved runtime. Every non-library handler is
 * created through `protect`: it authenticates the session first, applies CSRF defenses to state changes, and
 * only then calls an application command that itself authorizes membership and permission. A route that does
 * not use `protect` has no way to obtain a principal. The tenant ID always comes from the URL as requested
 * context; request bodies are strict schemas that cannot carry tenant or identity fields.
 */
export function createRouteHandlers(getRuntime: () => Promise<AuthRuntime>) {
  function protect<P extends Params>(handle: Handle<P>) {
    return async (
      request: Request,
      context: RouteContext<P>,
    ): Promise<Response> => {
      try {
        const runtime = await getRuntime();
        const principal = await requirePrincipal(runtime, request);
        assertTrustedMutation(runtime, request, principal);
        return await handle(runtime, principal, request, await context.params);
      } catch (error) {
        return problem(error);
      }
    };
  }

  const noContext: RouteContext<Params> = { params: Promise.resolve({}) };

  return {
    authApi: createAuthApiHandler(getRuntime),

    session: (request: Request) =>
      protect<Params>(async (runtime, principal) =>
        json(200, {
          user: { id: principal.userId, email: principal.email },
          csrfToken: runtime.csrfTokenFor(principal.sessionId),
          authenticatedAt: principal.authenticatedAt.toISOString(),
        }),
      )(request, noContext),

    tenants: (request: Request) =>
      protect<Params>(async (runtime, principal) =>
        json(200, {
          tenants: await runtime.authorization.listTenants(principal),
        }),
      )(request, noContext),

    /** Entering (switching to) a tenant: the destination is authorized like any other command. */
    tenant: protect<{ tenantId: string }>(
      async (runtime, principal, _request, params) =>
        json(
          200,
          await runtime.authorization.withTenant(
            principal,
            { tenantId: params.tenantId, permission: "tenant.access" },
            async (context) => ({
              tenantId: context.tenantId,
              role: context.actor.role,
              permissions: permissions.filter(
                (permission) => decide(context.actor.role, permission).allowed,
              ),
            }),
          ),
        ),
    ),

    members: protect<{ tenantId: string }>(
      async (runtime, principal, _request, params) =>
        json(200, {
          members: await runtime.staff.listMembers(principal, {
            tenantId: params.tenantId,
          }),
        }),
    ),

    changeMemberRole: protect<{ tenantId: string; membershipId: string }>(
      async (runtime, principal, request, params) => {
        const body = await readJson(request, roleBody);
        await runtime.staff.changeMemberRole(principal, {
          tenantId: params.tenantId,
          membershipId: params.membershipId,
          role: body.role,
        });
        return json(200, { role: body.role });
      },
    ),

    removeMember: protect<{ tenantId: string; membershipId: string }>(
      async (runtime, principal, _request, params) => {
        await runtime.staff.removeMember(principal, {
          tenantId: params.tenantId,
          membershipId: params.membershipId,
        });
        return new Response(null, {
          status: 204,
          headers: { "cache-control": "no-store" },
        });
      },
    ),

    listInvitations: protect<{ tenantId: string }>(
      async (runtime, principal, _request, params) =>
        json(200, {
          invitations: await runtime.staff.listInvitations(principal, {
            tenantId: params.tenantId,
          }),
        }),
    ),

    createInvitation: protect<{ tenantId: string }>(
      async (runtime, principal, request, params) => {
        const body = await readJson(request, inviteBody);
        const created = await runtime.staff.inviteStaff(principal, {
          tenantId: params.tenantId,
          email: body.email,
          role: body.role,
        });
        return json(201, {
          invitationId: created.invitationId,
          expiresAt: created.expiresAt.toISOString(),
        });
      },
    ),

    revokeInvitation: protect<{ tenantId: string; invitationId: string }>(
      async (runtime, principal, _request, params) =>
        json(
          200,
          await runtime.staff.revokeInvitation(principal, {
            tenantId: params.tenantId,
            invitationId: params.invitationId,
          }),
        ),
    ),

    acceptInvitation: (request: Request) =>
      protect<Params>(async (runtime, principal, req) => {
        const body = await readJson(req, acceptBody);
        const accepted = await runtime.staff.acceptInvitation(principal, {
          token: body.token,
        });
        return json(200, { tenantId: accepted.tenantId, role: accepted.role });
      })(request, noContext),
  };
}

export type RouteHandlers = ReturnType<typeof createRouteHandlers>;
