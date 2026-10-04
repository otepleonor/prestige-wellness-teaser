import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Workspaces } from "../_components/forms";
import { getAuthRuntime } from "../_server/runtime";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Workspaces",
  robots: { index: false, follow: false },
};

export default async function WorkspacesPage() {
  try {
    await (await getAuthRuntime()).authorization.authenticate(await headers());
  } catch {
    redirect("/auth/sign-in?next=/auth/workspaces");
  }
  return (
    <main>
      <h1>Galley</h1>
      <Workspaces />
    </main>
  );
}
