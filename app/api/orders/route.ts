import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { incrementCouponUsage } from "@/lib/db/coupons";
import { decrementStock, insertOrder } from "@/lib/db/orders";
import { withOptionalTransaction } from "@/lib/db/transactions";
import { buildCartWithCoupon, CartError } from "@/lib/server/cart";
import { orderInputSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = orderInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: parsed.error.issues[0]?.message ?? "Please check your order details",
        },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id ?? null;

    const cart = await buildCartWithCoupon(
      input.items,
      input.couponCode,
      input.customer.phone,
      input.customer.district,
    );

    const order = await withOptionalTransaction(async (session) => {
      for (const line of cart.lines) {
        await decrementStock(
          line.productId,
          line.size,
          line.quantity,
          session,
        );
      }

      if (cart.coupon) {
        await incrementCouponUsage(cart.coupon.code, session);
      }

      return insertOrder(
        {
          userId,
          customer: input.customer,
          items: cart.lines,
          coupon: cart.coupon,
          subtotal: cart.totals.subtotal,
          productDiscount: cart.totals.productDiscount,
          shipping: cart.totals.shipping,
          total: cart.totals.total,
          payment: {
            method: input.payment.method,
            transactionId: input.payment.transactionId,
            senderNumber: input.payment.senderNumber,
          },
        },
        cart.settings,
        session,
      );
    });

    return NextResponse.json({
      ok: true,
      token: order.publicToken,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    if (error instanceof CartError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }
    const message =
      error instanceof Error ? error.message : "Could not place the order";
    console.error("Order creation failed", error);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
