import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { AppFooter } from "@/components/AppFooter";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar role={session.role} userName={session.name} />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 overflow-auto p-6 md:p-8">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
