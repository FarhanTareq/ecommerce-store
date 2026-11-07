import { NextResponse, type NextRequest } from "next/server";
import { buildCartWithCoupon, CartError } from "@/lib/server/cart";
import { couponValidateSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = couponValidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const result = await buildCartWithCoupon(
      parsed.data.items,
      parsed.data.code,
      "",
      parsed.data.district,
    );

    if (!result.coupon) {
      return NextResponse.json(
        { ok: false, message: "Coupon could not be applied" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      coupon: result.coupon,
      totals: result.totals,
    });
  } catch (error) {
    if (error instanceof CartError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }
    console.error("Coupon validation failed", error);
    return NextResponse.json(
      { ok: false, message: "Could not validate coupon right now" },
      { status: 500 },
    );
  }
}
