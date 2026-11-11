import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getActor } from "@/lib/server/authorization";
import { firstAllowedAdminPath } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const actor = await getActor();
  if (actor?.isAdmin) redirect(firstAllowedAdminPath(actor.permissions));
  const params = await searchParams;

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <AdminLoginForm initialError={params.error ?? ""} />
    </div>
  );
}
