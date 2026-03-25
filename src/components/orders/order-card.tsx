import Link from "next/link";
import { Calendar, MessageSquare } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import type { Order } from "@/lib/types";
import { formatInquiryDate } from "@/lib/utils";

export function OrderCard({ order }: { order: Order }) {
  const expectedDate = order.expected_date
    ? new Date(order.expected_date).toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
          {order.order_number}
        </p>
        <OrderStatusBadge status={order.status} />
      </div>

      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Створено: {formatInquiryDate(order.created_at)}
      </p>

      {expectedDate && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
          <Calendar size={14} className="shrink-0" />
          <span>Очікувана дата: {expectedDate}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/profile/orders/${order.id}`}
          className="inline-flex items-center rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)]"
        >
          Деталі
        </Link>
        <Link
          href={`/profile/orders/${order.id}/messages`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-warm)]"
        >
          <MessageSquare size={13} />
          Написати майстру
        </Link>
      </div>
    </article>
  );
}
