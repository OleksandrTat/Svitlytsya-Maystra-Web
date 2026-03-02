"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

export type MobileOrderCardItem = {
  id: string;
  orderNumber: string;
  status:
    | "new"
    | "consulting"
    | "design"
    | "approved"
    | "production"
    | "ready"
    | "installation"
    | "completed"
    | "archived";
  clientName: string;
  serviceType: string;
  amount: number | null;
  createdAt: string;
};

export function OrderMobileCard({ order }: { order: MobileOrderCardItem }) {
  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white p-4 active:scale-[0.98] transition"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--color-text-secondary)]">{order.orderNumber}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{order.clientName}</p>
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{order.serviceType}</p>
      </div>

      <div className="shrink-0 text-right">
        {order.amount !== null ? (
          <p className="text-sm font-semibold text-[var(--color-primary)]">
            {Math.round(order.amount).toLocaleString("uk-UA")} грн
          </p>
        ) : null}
        <p className="text-xs text-[var(--color-text-secondary)]">
          {new Intl.DateTimeFormat("uk-UA", { dateStyle: "medium" }).format(new Date(order.createdAt))}
        </p>
      </div>
      <ChevronRight size={16} className="text-[var(--color-gray-300)]" />
    </Link>
  );
}
