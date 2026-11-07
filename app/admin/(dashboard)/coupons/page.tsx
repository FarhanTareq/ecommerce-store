import CouponManager from "@/components/admin/CouponManager";
import { getCoupons } from "@/lib/db/coupons";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
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
      <CouponManager coupons={coupons} />
    </div>
  );
}
