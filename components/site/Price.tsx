import { getSalePrice } from "@/lib/pricing";
import { formatBDT } from "@/lib/utils";

export function Price({
  price,
  discountPercent,
  size = "md",
}: {
  price: number;
  discountPercent: number;
  size?: "sm" | "md" | "lg";
}) {
  const sale = getSalePrice(price, discountPercent);
  const sizeMap = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-3xl",
  } as const;
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-extrabold ${sizeMap[size]}`}>{formatBDT(sale)}</span>
      {discountPercent > 0 ? (
        <span className="text-sm font-medium text-ink/40 line-through">{formatBDT(price)}</span>
      ) : null}
    </div>
  );
}
