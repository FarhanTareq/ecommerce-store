import SettingsForm from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/db/settings";
import { requirePagePermission } from "@/lib/server/page-guards";
import { actorHas } from "@/lib/server/authorization";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const actor = await requirePagePermission("settings.view");
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <p className="eyebrow">Configuration</p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Store settings.</h1>
        <p className="mt-1 text-sm text-ink/50">
          Shipping fees, payment numbers and contact details.
        </p>
      </div>
      <SettingsForm
        settings={settings}
        canEdit={actorHas(actor, "settings.edit")}
      />
    </div>
  );
}
