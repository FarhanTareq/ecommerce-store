import type { CartLine, CartTotals, Coupon, Settings } from "./types";

export function getSalePrice(price: number, discountPercent: number) {
  const safeDiscount = Math.min(Math.max(discountPercent, 0), 95);
  return Math.max(0, Math.round(price - (price * safeDiscount) / 100));
}

export function getDiscountAmount(price: number, discountPercent: number) {
  return price - getSalePrice(price, discountPercent);
}

export function calculateCouponDiscount(
  coupon: Pick<Coupon, "type" | "value" | "maxDiscount">,
  amount: number,
) {
  if (amount <= 0) return 0;
  if (coupon.type === "fixed") {
    return Math.min(Math.round(coupon.value), amount);
  }
  const raw = Math.round((amount * coupon.value) / 100);
  const capped = coupon.maxDiscount > 0 ? Math.min(raw, coupon.maxDiscount) : raw;
  return Math.min(capped, amount);
}

export function isInsideDhaka(district: string) {
  return district.trim().toLowerCase() === "dhaka";
}

export function getShippingFee(
  settings: Pick<
    Settings,
    "insideDhakaFee" | "outsideDhakaFee" | "freeShippingThreshold"
  >,
  district: string,
  payable: number,
) {
  if (settings.freeShippingThreshold > 0 && payable >= settings.freeShippingThreshold) {
    return 0;
  }
  return isInsideDhaka(district) ? settings.insideDhakaFee : settings.outsideDhakaFee;
}

export function calculateTotals(
  lines: Pick<CartLine, "price" | "discountPercent" | "quantity">[],
  couponDiscount: number,
  settings: Pick<
    Settings,
    "insideDhakaFee" | "outsideDhakaFee" | "freeShippingThreshold"
  >,
  district = "Dhaka",
): CartTotals {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const productDiscount = lines.reduce(
    (sum, line) =>
      sum + getDiscountAmount(line.price, line.discountPercent) * line.quantity,
    0,
  );
  const afterDiscount = subtotal - productDiscount;
  const safeCoupon = Math.min(Math.max(Math.round(couponDiscount), 0), afterDiscount);
  const shipping = getShippingFee(
    settings,
    district,
    afterDiscount - safeCoupon,
  );
  const total = afterDiscount - safeCoupon + shipping;

  return {
    subtotal,
    productDiscount,
    couponDiscount: safeCoupon,
    shipping,
    total,
    afterDiscount,
  };
}

export function availableStock(stock: number) {
  return Math.max(0, stock);
}
