import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdminEditForm from "@/components/owner/AdminEditForm";
import { getAdminProfile, getAuthUserById } from "@/lib/db/admin";
import { requireOwnerPage } from "@/lib/server/page-guards";

export const dynamic = "force-dynamic";

export default async function EditAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await requireOwnerPage();
  const { id } = await params;
  if (id === owner.userId) redirect("/owner/security");

  const user = await getAuthUserById(id);
  if (!user || user.role === "owner") notFound();
  const profile = await getAdminProfile(id);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/owner/admins"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to admins
      </Link>
      <div className="mb-5">
        <p className="eyebrow">Owner control</p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Edit admin.</h1>
        <p className="mt-1 text-sm text-ink/50">
          Update permissions, suspend access, or permanently delete this admin account.
        </p>
      </div>
      <AdminEditForm
        userId={user.id}
        email={user.email}
        name={user.name || "Admin"}
        initialPermissions={profile?.permissions ?? []}
        initialStatus={profile?.status ?? "active"}
      />
    </div>
  );
}
