import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { OrderStatusHistory } from "@/lib/types";
import { formatInquiryDate } from "@/lib/utils";

export function OrderTimeline({ items }: { items: OrderStatusHistory[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-secondary)]">
        Timeline is empty for this order.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <OrderStatusBadge status={item.to_status} />
            <span className="text-xs text-[var(--color-text-secondary)]">
              {formatInquiryDate(item.created_at)}
            </span>
          </div>
          {item.comment ? (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{item.comment}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
