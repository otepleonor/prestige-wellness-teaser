import { SignInForm } from "../_components/forms";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function SignInPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await props.searchParams;
  const next = typeof query.next === "string" ? query.next : undefined;
  return (
    <main>
      <h1>Sign in to Galley</h1>
      {query.verified ? (
        <p role="status">Email verified. You can sign in now.</p>
      ) : null}
      {query.error ? (
        <p role="alert">That verification link is invalid or expired.</p>
      ) : null}
      <SignInForm {...(next ? { next } : {})} />
    </main>
  );
}
