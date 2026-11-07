"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { authClient, signIn, signOut } from "@/lib/auth-client";

export default function AdminLoginForm({ initialError = "" }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        toast.error(result.error.message || "Could not sign in");
        return;
      }
      const session = await authClient.getSession();
      const role = (session.data?.user as { role?: string } | undefined)?.role;
      if (role !== "admin") {
        await signOut();
        toast.error("This account does not have admin access");
        return;
      }
      toast.success("Admin access granted");
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Could not sign in. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xl sm:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-volt">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="display mt-4 text-3xl font-bold">Admin access.</h1>
        <p className="mt-2 text-sm text-ink/50">
          Sign in with the admin account created during store setup.
        </p>

        {initialError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            That account cannot access the admin panel. Use the admin credentials.
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="email">Admin email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input pl-9"
                placeholder="admin@sporsify.com"
                autoComplete="email"
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input pl-9"
                placeholder="Admin password"
                autoComplete="current-password"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-dark w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enter dashboard
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-xs text-ink/40">
        Need the first admin? Run <code className="rounded bg-white px-1.5 py-0.5">npm run seed</code> after
        adding your database keys.
      </p>
    </div>
  );
}
