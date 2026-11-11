import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminCreateForm from "@/components/owner/AdminCreateForm";

export const dynamic = "force-dynamic";

export default function NewAdminPage() {
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
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Create an admin.</h1>
        <p className="mt-1 text-sm text-ink/50">
          Set the initial password and choose the exact permissions this admin should have.
        </p>
      </div>
      <AdminCreateForm />
    </div>
  );
}
