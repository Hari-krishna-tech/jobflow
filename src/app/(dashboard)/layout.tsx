import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";

/*
 * Authenticated route group layout (CONTEXT/03 §1).
 *
 * Middleware already guards these routes; this is defense-in-depth (a server
 * component that re-checks the session) and is where the app shell mounts. The
 * signed-in user's name/email is passed to the shell for the avatar menu.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <AppShell user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </AppShell>
  );
}
