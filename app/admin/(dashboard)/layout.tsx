import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getActor } from "@/lib/server/authorization";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getActor();
  if (!actor) redirect("/admin/login");
  if (!actor.isAdmin) redirect("/admin/forbidden");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar
        adminName={actor.name || actor.email || "Admin"}
        permissions={actor.permissions}
        isOwner={actor.isOwner}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
