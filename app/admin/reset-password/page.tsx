import ResetPasswordForm from "@/components/admin/ResetPasswordForm";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <ResetPasswordForm token={params.token ?? ""} />
    </div>
  );
}
