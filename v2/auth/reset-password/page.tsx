import { ResetPasswordForm } from "../_components/forms";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await props.searchParams;
  const token = typeof query.token === "string" ? query.token : "";
  if (!token || query.error)
    return (
      <main>
        <h1>Choose a new password</h1>
        <p role="alert">This reset link is invalid or expired.</p>
        <p>
          <a href="/auth/forgot-password">Request a new link</a>
        </p>
      </main>
    );
  return (
    <main>
      <h1>Choose a new password</h1>
      <ResetPasswordForm token={token} />
    </main>
  );
}
