import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getServerSession, sessionRole } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session?.user) redirect("/admin/login");
  if (sessionRole(session) !== "admin") redirect("/admin/login?error=forbidden");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar adminName={session.user.name || session.user.email || "Admin"} />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
