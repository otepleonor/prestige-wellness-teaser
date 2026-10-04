import { ForgotPasswordForm } from "../_components/forms";

export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <main>
      <h1>Reset your password</h1>
      <ForgotPasswordForm />
    </main>
  );
}
