import { headers } from "next/headers";
import { AcceptInvitation } from "../_components/forms";
import { getAuthRuntime } from "../_server/runtime";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Accept invitation",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default async function AcceptInvitationPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await props.searchParams;
  const token = typeof query.token === "string" ? query.token : "";
  if (!token)
    return (
      <main>
        <h1>Accept invitation</h1>
        <p role="alert">This invitation link is incomplete.</p>
      </main>
    );
  let signedIn = false;
  try {
    await (await getAuthRuntime()).authorization.authenticate(await headers());
    signedIn = true;
  } catch {
    // Unauthenticated visitors see the sign-up/sign-in choice.
  }
  return (
    <main>
      <h1>Accept invitation</h1>
      <AcceptInvitation token={token} signedIn={signedIn} />
    </main>
  );
}
