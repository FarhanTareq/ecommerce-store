import { redirect } from "next/navigation";
import ForgotPasswordForm from "@/components/admin/ForgotPasswordForm";
import { getActor } from "@/lib/server/authorization";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const actor = await getActor();
  if (actor?.isAdmin) redirect("/admin");

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <ForgotPasswordForm />
    </div>
  );
}
