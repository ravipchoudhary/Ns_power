import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppLayoutClient } from "@/components/AppLayoutClient";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <AppLayoutClient role={session.role} userName={session.name}>
      {children}
    </AppLayoutClient>
  );
}
