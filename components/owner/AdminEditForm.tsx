"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteAdminAction,
  updateAdminAction,
} from "@/app/owner/actions";
import PermissionPicker from "./PermissionPicker";

export default function AdminEditForm({
  userId,
  email,
  name,
  initialPermissions,
  initialStatus,
}: {
  userId: string;
  email: string;
  name: string;
  initialPermissions: string[];
  initialStatus: "active" | "suspended";
}) {
  const router = useRouter();
  const [permissions, setPermissions] = useState(initialPermissions);
  const [status, setStatus] = useState<"active" | "suspended">(initialStatus);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!permissions.length) {
      toast.error("Choose at least one permission");
      return;
    }
    setSaving(true);
    try {
      const result = await updateAdminAction({ userId, permissions, status });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    } catch {
      toast.error("Could not update the admin");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete the admin account ${email}? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      const result = await deleteAdminAction(userId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push("/owner/admins");
      router.refresh();
    } catch {
      toast.error("Could not delete the admin");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold">{name}</p>
            <p className="text-xs text-ink/45">{email}</p>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input
              type="checkbox"
              checked={status === "active"}
              onChange={(event) =>
                setStatus(event.target.checked ? "active" : "suspended")
              }
              className="h-4 w-4 accent-black"
            />
            Active
          </label>
        </div>
        <p className="mt-3 rounded-xl bg-paper p-3 text-xs leading-5 text-ink/50">
          Suspending an admin revokes their sessions and blocks sign-in until the
          account is reactivated.
        </p>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
        <p className="text-sm font-bold">Permissions</p>
        <div className="mt-3">
          <PermissionPicker value={permissions} onChange={setPermissions} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          className="btn-outline border-red-200 text-red-600 hover:border-red-600 hover:bg-red-600 hover:text-white"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete admin
        </button>
        <button type="submit" disabled={saving} className="btn-dark">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </button>
      </div>
    </form>
  );
}
