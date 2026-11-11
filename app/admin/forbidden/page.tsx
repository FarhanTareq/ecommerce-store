import Link from "next/link";
import { ShieldX } from "lucide-react";
import { getActor } from "@/lib/server/authorization";

export const dynamic = "force-dynamic";

export default async function AdminForbiddenPage() {
  const actor = await getActor();
  const suspended = actor?.profileStatus === "suspended";

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-white p-7 text-center shadow-xl">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
          <ShieldX className="h-7 w-7" />
        </span>
        <h1 className="display mt-4 text-3xl font-bold">Access denied.</h1>
        <p className="mt-2 text-sm text-ink/50">
          {suspended
            ? "This admin account is suspended. Contact the Owner to restore access."
            : actor
              ? "This account does not have access to the admin panel."
              : "Sign in with an authorized admin account to continue."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/admin/login" className="btn-dark justify-center">
            Go to admin sign in
          </Link>
          <Link href="/" className="btn-outline justify-center">
            Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}
