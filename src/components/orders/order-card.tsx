import Link from "next/link";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { Order } from "@/lib/types";
import { formatInquiryDate } from "@/lib/utils";

export function OrderCard({ order }: { order: Order }) {
  return (
    <article className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-[var(--color-text-primary)]">{order.order_number}</p>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
        Created: {formatInquiryDate(order.created_at)}
      </p>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
        Expected: {order.expected_date ? new Date(order.expected_date).toLocaleDateString("uk-UA") : "-"}
      </p>
      <div className="mt-4">
        <Link
          href={`/profile/orders/${order.id}`}
          className="text-sm font-medium text-[var(--color-primary)] underline"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
