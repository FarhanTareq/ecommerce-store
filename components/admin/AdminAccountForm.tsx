"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  KeyRound,
  Loader2,
  Mail,
  Send,
  Save,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/lib/auth-client";
import {
  changeOwnerEmailAction,
  requestEmailChangeAction,
  requestPasswordChangeAction,
} from "@/app/admin/account/actions";

type PendingRequest = {
  id: string;
  type: string;
  proposedEmail: string;
  createdAt: string;
};

const requestLabels: Record<string, string> = {
  email_change: "Email change",
  password_change: "Password change",
  password_recovery: "Password recovery",
};

export default function AdminAccountForm({
  isOwner,
  currentEmail,
  pending,
}: {
  isOwner: boolean;
  currentEmail: string;
  pending: PendingRequest[];
}) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerEmailPassword, setOwnerEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [emailReason, setEmailReason] = useState("");
  const [passwordReason, setPasswordReason] = useState("");
  const [requestingEmail, setRequestingEmail] = useState(false);
  const [requestingPassword, setRequestingPassword] = useState(false);

  async function changeOwnerEmail(event: React.FormEvent) {
    event.preventDefault();
    setSavingEmail(true);
    try {
      const result = await changeOwnerEmailAction({
        email: ownerEmail,
        currentPassword: ownerEmailPassword,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setOwnerEmailPassword("");
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("Could not change the Owner email");
    } finally {
      setSavingEmail(false);
    }
  }

  async function changeOwnerPassword(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        toast.error(result.error.message || "Could not change the password");
        return;
      }
      toast.success("Owner password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Could not change the password. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function requestEmail(event: React.FormEvent) {
    event.preventDefault();
    setRequestingEmail(true);
    try {
      const result = await requestEmailChangeAction({
        email,
        reason: emailReason,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setEmail("");
      setEmailReason("");
    } catch {
      toast.error("Could not submit the request");
    } finally {
      setRequestingEmail(false);
    }
  }

  async function requestPassword(event: React.FormEvent) {
    event.preventDefault();
    setRequestingPassword(true);
    try {
      const result = await requestPasswordChangeAction(passwordReason);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setPasswordReason("");
    } catch {
      toast.error("Could not submit the request");
    } finally {
      setRequestingPassword(false);
    }
  }

  return (
    <div className="space-y-5">
      {pending.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 font-bold text-amber-900">
            <ShieldQuestion className="h-4 w-4" /> Pending Owner approval
          </h2>
          <ul className="mt-3 space-y-2 text-xs text-amber-800">
            {pending.map((item) => (
              <li key={item.id} className="rounded-lg bg-white/60 p-3">
                <span className="font-bold">{requestLabels[item.type] ?? item.type}</span>
                {item.proposedEmail ? ` → ${item.proposedEmail}` : ""}
                <span className="block text-amber-700/70">
                  Requested {new Date(item.createdAt).toLocaleString("en-BD")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isOwner ? (
        <div className="space-y-5">
          <form
            onSubmit={changeOwnerEmail}
            className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-volt">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold">Change Owner email</h2>
                <p className="text-xs text-ink/45">
                  Current email: {currentEmail}. Confirm with your password; this signs out all sessions.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="owner-email">New email</label>
                <input
                  id="owner-email"
                  type="email"
                  required
                  value={ownerEmail}
                  onChange={(event) => setOwnerEmail(event.target.value)}
                  className="input"
                  autoComplete="email"
                  placeholder={currentEmail}
                />
              </div>
              <div>
                <label className="label" htmlFor="owner-email-password">Current password</label>
                <input
                  id="owner-email-password"
                  type="password"
                  required
                  minLength={8}
                  value={ownerEmailPassword}
                  onChange={(event) => setOwnerEmailPassword(event.target.value)}
                  className="input"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button type="submit" disabled={savingEmail} className="btn-dark mt-4">
              {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Update Owner email
            </button>
          </form>

          <form
            onSubmit={changeOwnerPassword}
            className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6"
          >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-volt">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold">Change Owner password</h2>
              <p className="text-xs text-ink/45">
                Other signed-in sessions will be logged out.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <label className="label" htmlFor="currentPassword">Current password</label>
              <input
                id="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="input"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="newPassword">New password</label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="confirmPassword">Confirm new password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs text-ink/45">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Password changes are written to MongoDB immediately.
            </p>
            <button type="submit" disabled={saving} className="btn-dark">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Update password
            </button>
          </div>

          <p className="mt-4 rounded-xl bg-paper p-3 text-xs leading-5 text-ink/50">
            Locked out? Run <code className="rounded bg-white px-1.5 py-0.5">npm run owner:reset</code>{" "}
            on the server for an immediate terminal recovery. Owner security controls are in the{" "}
            <Link href="/owner/security" className="font-bold text-ink hover:text-coral">
              Owner Panel
            </Link>.
          </p>
          </form>
        </div>
      ) : (
        <div className="space-y-5">
          <form
            onSubmit={requestEmail}
            className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-volt">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold">Request an email change</h2>
                <p className="text-xs text-ink/45">
                  The Owner must approve. Your email will not change until then.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4">
              <div>
                <label className="label" htmlFor="request-email">New email</label>
                <input
                  id="request-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label" htmlFor="email-reason">Reason (optional)</label>
                <textarea
                  id="email-reason"
                  value={emailReason}
                  onChange={(event) => setEmailReason(event.target.value)}
                  className="input min-h-20 resize-y"
                  maxLength={500}
                />
              </div>
            </div>
            <button type="submit" disabled={requestingEmail} className="btn-dark mt-4">
              {requestingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send email request
            </button>
          </form>

          <form
            onSubmit={requestPassword}
            className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-paper">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-bold">Request a password change</h2>
                <p className="text-xs text-ink/45">
                  Admins cannot change their own password. The Owner issues a one-time link.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <label className="label" htmlFor="password-reason">Reason (optional)</label>
              <textarea
                id="password-reason"
                value={passwordReason}
                onChange={(event) => setPasswordReason(event.target.value)}
                className="input min-h-20 resize-y"
                maxLength={500}
              />
            </div>
            <button type="submit" disabled={requestingPassword} className="btn-dark mt-4">
              {requestingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send password request
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
