"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

type Notice = { kind: "error" | "info"; text: string } | null;

async function send(
  path: string,
  method: "POST",
  body: unknown,
  csrfToken?: string,
): Promise<Response> {
  return fetch(path, {
    method,
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
      ...(csrfToken ? { "x-galley-csrf": csrfToken } : {}),
    },
    body: JSON.stringify(body),
  });
}

function Message({ notice }: { notice: Notice }): ReactNode {
  if (!notice) return null;
  return (
    <p
      role={notice.kind === "error" ? "alert" : "status"}
      data-kind={notice.kind}
    >
      {notice.text}
    </p>
  );
}

/**
 * Forms only become submittable once the client handler is attached. Before hydration a native submission
 * would put the credentials in the URL, so the submit control stays disabled until then.
 */
function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

function field(form: HTMLFormElement, name: string): string {
  return String(new FormData(form).get(name) ?? "");
}

/** Only same-site relative paths are followed after sign-in; anything else falls back to the workspace list. */
function safeNext(next: string | undefined): string {
  return next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.includes("\\")
    ? next
    : "/auth/workspaces";
}

export function SignInForm({ next }: { next?: string }): ReactNode {
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);
  const hydrated = useHydrated();
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setNotice(null);
    const response = await send("/auth/api/sign-in/email", "POST", {
      email: field(form, "email"),
      password: field(form, "password"),
    });
    setBusy(false);
    if (response.ok) {
      window.location.assign(safeNext(next));
      return;
    }
    setNotice({
      kind: "error",
      text:
        response.status === 429
          ? "Too many attempts. Wait a moment and try again."
          : response.status === 403
            ? "Verify your email address first, then sign in."
            : "Invalid email or password.",
    });
  }
  return (
    <form method="post" onSubmit={submit} aria-label="Sign in">
      <label>
        Email{" "}
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password{" "}
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button type="submit" disabled={busy || !hydrated}>
        Sign in
      </button>
      <Message notice={notice} />
      <p>
        <a href="/auth/forgot-password">Forgot your password?</a>
      </p>
    </form>
  );
}

export function ForgotPasswordForm(): ReactNode {
  const [notice, setNotice] = useState<Notice>(null);
  const hydrated = useHydrated();
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await send("/auth/api/request-password-reset", "POST", {
      email: field(form, "email"),
      redirectTo: "/auth/reset-password",
    });
    // The same message whether or not the address has an account.
    setNotice(
      response.status === 429
        ? { kind: "error", text: "Too many requests. Try again in a minute." }
        : {
            kind: "info",
            text: "If that address has an account, a reset link is on its way.",
          },
    );
  }
  return (
    <form method="post" onSubmit={submit} aria-label="Request password reset">
      <label>
        Email{" "}
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <button type="submit" disabled={!hydrated}>
        Send reset link
      </button>
      <Message notice={notice} />
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }): ReactNode {
  const [notice, setNotice] = useState<Notice>(null);
  const hydrated = useHydrated();
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await send("/auth/api/reset-password", "POST", {
      token,
      newPassword: field(form, "password"),
    });
    setNotice(
      response.ok
        ? { kind: "info", text: "Password changed. You can sign in now." }
        : {
            kind: "error",
            text: "This reset link is invalid or expired, or the password is too weak (12+ characters).",
          },
    );
  }
  return (
    <form method="post" onSubmit={submit} aria-label="Choose a new password">
      <label>
        New password{" "}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </label>
      <button type="submit" disabled={!hydrated}>
        Change password
      </button>
      <Message notice={notice} />
      <p>
        <a href="/auth/sign-in">Back to sign in</a>
      </p>
    </form>
  );
}

export function AcceptInvitation({
  token,
  signedIn,
}: {
  token: string;
  signedIn: boolean;
}): ReactNode {
  const [notice, setNotice] = useState<Notice>(null);
  const hydrated = useHydrated();
  async function accept(): Promise<void> {
    const session = await fetch("/auth/session", {
      credentials: "same-origin",
    });
    if (!session.ok) {
      setNotice({ kind: "error", text: "Sign in first." });
      return;
    }
    const { csrfToken } = (await session.json()) as { csrfToken: string };
    const response = await send(
      "/auth/invitations/accept",
      "POST",
      { token },
      csrfToken,
    );
    if (response.ok) {
      window.location.assign("/auth/workspaces");
      return;
    }
    setNotice({
      kind: "error",
      text: "This invitation is invalid, expired, already used, or was issued to a different email address.",
    });
  }
  async function signUp(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await send("/auth/api/sign-up/email", "POST", {
      name: field(form, "name"),
      email: field(form, "email"),
      password: field(form, "password"),
      invitationToken: token,
      callbackURL: "/auth/sign-in?verified=1",
    });
    setNotice(
      response.ok
        ? {
            kind: "info",
            text: "Check your email to verify the address, then sign in and return to this invitation link.",
          }
        : {
            kind: "error",
            text: "Sign-up requires the invited email address and a password of at least 12 characters.",
          },
    );
  }
  if (signedIn)
    return (
      <div>
        <button
          type="button"
          disabled={!hydrated}
          onClick={() => void accept()}
        >
          Accept invitation
        </button>
        <Message notice={notice} />
      </div>
    );
  return (
    <div>
      <h2>Create your account</h2>
      <form method="post" onSubmit={signUp} aria-label="Create account">
        <label>
          Name{" "}
          <input name="name" autoComplete="name" required maxLength={200} />
        </label>
        <label>
          Invited email{" "}
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password{" "}
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
        <button type="submit" disabled={!hydrated}>
          Create account
        </button>
        <Message notice={notice} />
      </form>
      <p>
        Already have an account?{" "}
        <a
          href={`/auth/sign-in?next=${encodeURIComponent(`/auth/accept-invitation?token=${token}`)}`}
        >
          Sign in
        </a>
      </p>
    </div>
  );
}

interface TenantRow {
  tenantId: string;
  role: string;
}

export function Workspaces(): ReactNode {
  const [tenants, setTenants] = useState<TenantRow[] | null>(null);
  const [detail, setDetail] = useState<string>("");
  useEffect(() => {
    void (async () => {
      const response = await fetch("/auth/tenants", {
        credentials: "same-origin",
      });
      if (response.status === 401) {
        window.location.assign("/auth/sign-in?next=/auth/workspaces");
        return;
      }
      setTenants(((await response.json()) as { tenants: TenantRow[] }).tenants);
    })();
  }, []);
  async function enter(tenantId: string): Promise<void> {
    const response = await fetch(`/auth/tenants/${tenantId}`, {
      credentials: "same-origin",
    });
    setDetail(
      response.ok
        ? JSON.stringify(await response.json())
        : `Access denied (${response.status})`,
    );
  }
  async function signOut(): Promise<void> {
    await send("/auth/api/sign-out", "POST", {});
    window.location.assign("/auth/sign-in");
  }
  return (
    <div>
      <h2>Your workspaces</h2>
      {tenants === null ? <p>Loading…</p> : null}
      {tenants?.length === 0 ? (
        <p>You are not a member of any workspace yet.</p>
      ) : null}
      <ul>
        {tenants?.map((tenant) => (
          <li key={tenant.tenantId}>
            <code>{tenant.tenantId}</code> — {tenant.role}{" "}
            <button type="button" onClick={() => void enter(tenant.tenantId)}>
              Open
            </button>
          </li>
        ))}
      </ul>
      <pre data-testid="tenant-detail">{detail}</pre>
      <button type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  );
}
