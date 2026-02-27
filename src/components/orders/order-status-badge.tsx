import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusClassMap: Record<OrderStatus, string> = {
  new: "bg-zinc-100 text-zinc-700",
  consulting: "bg-sky-100 text-sky-800",
  design: "bg-indigo-100 text-indigo-800",
  approved: "bg-violet-100 text-violet-800",
  production: "bg-amber-100 text-amber-800",
  ready: "bg-emerald-100 text-emerald-800",
  installation: "bg-emerald-100 text-emerald-800",
  completed: "bg-green-100 text-green-800",
  archived: "bg-zinc-100 text-zinc-600",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        statusClassMap[status],
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
