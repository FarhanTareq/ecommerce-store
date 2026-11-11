import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireOwnerPage } from "@/lib/server/page-guards";

export const dynamic = "force-dynamic";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await requireOwnerPage();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar
        adminName={actor.name || actor.email || "Owner"}
        permissions={actor.permissions}
        isOwner
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
