import { authBasePath } from "@galley/auth";
import type { AuthRuntime } from "./runtime";

/**
 * The identity library exposes many endpoints (social login, account linking, profile and session
 * management). Galley serves only the ones its flows need; everything else is a 404 before the library
 * sees the request, so an endpoint added by a future upgrade is closed until deliberately listed here.
 */
const allowed: readonly { readonly method: string; readonly path: RegExp }[] = [
  { method: "POST", path: /^\/sign-in\/email$/ },
  { method: "POST", path: /^\/sign-up\/email$/ },
  { method: "POST", path: /^\/sign-out$/ },
  { method: "POST", path: /^\/request-password-reset$/ },
  { method: "GET", path: /^\/reset-password\/[A-Za-z0-9_-]{8,128}$/ },
  { method: "POST", path: /^\/reset-password$/ },
  { method: "GET", path: /^\/verify-email$/ },
  { method: "POST", path: /^\/send-verification-email$/ },
];

const notFound = (): Response =>
  new Response(JSON.stringify({ error: { code: "NOT_FOUND" } }), {
    status: 404,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

function stripSessionTokens(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value))
    return value.map((item) => stripSessionTokens(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "token")
      .map(([key, item]) => [key, stripSessionTokens(item, depth + 1)]),
  );
}

/** The session bearer travels only in the HttpOnly cookie; script-readable response bodies never carry it. */
async function redactSessionToken(response: Response): Promise<Response> {
  if (
    !(response.headers.get("content-type") ?? "").includes("application/json")
  )
    return response;
  const text = await response.text();
  let body = text;
  try {
    body = JSON.stringify(stripSessionTokens(JSON.parse(text)));
  } catch {
    // Not JSON after all: forward untouched.
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.set("cache-control", "no-store");
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function createAuthApiHandler(
  getRuntime: () => Promise<AuthRuntime>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const pathname = new URL(request.url).pathname;
    if (!pathname.startsWith(`${authBasePath}/`)) return notFound();
    const relative = pathname.slice(authBasePath.length);
    if (
      !allowed.some(
        (rule) => rule.method === request.method && rule.path.test(relative),
      )
    )
      return notFound();
    const runtime = await getRuntime();
    return redactSessionToken(await runtime.auth.handler(request));
  };
}
