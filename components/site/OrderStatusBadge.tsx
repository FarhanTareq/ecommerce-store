import type { OrderStatus } from "@/lib/types";
import { orderStatusLabels, orderStatusStyles } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export default function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
        orderStatusStyles[status],
        className,
      )}
    >
      {orderStatusLabels[status]}
    </span>
  );
}
