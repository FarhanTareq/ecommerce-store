"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KeyRound, Loader2, Save, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { createAdminAction } from "@/app/owner/actions";
import PermissionPicker from "./PermissionPicker";

function generatePassword() {
  const charset =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const values = new Uint32Array(20);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => charset[value % charset.length]).join("");
}

export default function AdminCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!permissions.length) {
      toast.error("Choose at least one permission");
      return;
    }
    setSaving(true);
    try {
      const result = await createAdminAction({
        name,
        email,
        password,
        permissions,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push("/owner/admins");
      router.refresh();
    } catch {
      toast.error("Could not create the admin");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="admin-name">Full name</label>
          <input
            id="admin-name"
            required
            minLength={2}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="admin-password">Initial password</label>
        <div className="flex gap-2">
          <input
            id="admin-password"
            type="text"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input font-mono"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setPassword(generatePassword())}
            className="btn-outline shrink-0 px-3"
          >
            <Wand2 className="h-4 w-4" /> Generate
          </button>
        </div>
        <p className="mt-1 text-[11px] text-ink/45">
          Share this password privately. The admin will be prompted to keep it safe;
          they cannot change it without Owner approval.
        </p>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-ink/45" />
          <p className="text-sm font-bold">Permissions</p>
        </div>
        <div className="mt-3">
          <PermissionPicker value={permissions} onChange={setPermissions} />
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-dark mt-5">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Create admin
      </button>
    </form>
  );
}
