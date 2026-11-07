import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getServerSession, sessionRole } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getServerSession();
  if (session?.user && sessionRole(session) === "admin") redirect("/admin");
  const params = await searchParams;

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <AdminLoginForm initialError={params.error ?? ""} />
    </div>
  );
}
