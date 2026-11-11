import CouponManager from "@/components/admin/CouponManager";
import { getCoupons } from "@/lib/db/coupons";
import { requirePagePermission } from "@/lib/server/page-guards";
import { actorHas } from "@/lib/server/authorization";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const actor = await requirePagePermission("coupons.view");
  const coupons = await getCoupons();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5">
        <p className="eyebrow">Offers</p>
        <h1 className="display mt-1 text-3xl font-bold sm:text-4xl">Coupons.</h1>
        <p className="mt-1 text-sm text-ink/50">
          Create extra discounts for campaigns, athletes and loyal customers.
        </p>
      </div>
      <CouponManager
        coupons={coupons}
        canCreate={actorHas(actor, "coupons.create")}
        canEdit={actorHas(actor, "coupons.edit")}
        canDelete={actorHas(actor, "coupons.delete")}
      />
    </div>
  );
}
