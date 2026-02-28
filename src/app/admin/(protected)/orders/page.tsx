import Link from "next/link";
import { Eye, MessageSquare } from "lucide-react";
import { createOrderFromInquiryAction, updateOrderStatusAction } from "@/actions/orders";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { RowActions } from "@/components/admin/shared/row-actions";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { ORDER_PRIORITY_LABELS, ORDER_STATUS_LABELS } from "@/lib/constants";
import { getAllInquiriesForAdmin, getOrdersForAdmin } from "@/lib/data/queries";
import type { Order, OrderStatus } from "@/lib/types";
import { formatInquiryDate } from "@/lib/utils";

const orderStatuses: OrderStatus[] = [
  "new",
  "consulting",
  "design",
  "approved",
  "production",
  "ready",
  "installation",
  "completed",
  "archived",
];

function applyOrderFilters(
  orders: Order[],
  searchParams: { status?: string; q?: string; priority?: string },
) {
  let filtered = [...orders];

  if (searchParams.status) {
    filtered = filtered.filter((order) => order.status === searchParams.status);
  }

  if (searchParams.priority) {
    filtered = filtered.filter((order) => order.priority === searchParams.priority);
  }

  if (searchParams.q) {
    const query = searchParams.q.toLowerCase();
    filtered = filtered.filter(
      (order) =>
        order.order_number.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query),
    );
  }

  return filtered;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; priority?: string }>;
}) {
  const params = await searchParams;
  const [orders, inquiries] = await Promise.all([getOrdersForAdmin(400), getAllInquiriesForAdmin()]);
  const filteredOrders = applyOrderFilters(orders, params);

  const createOrder = async (formData: FormData) => {
    "use server";
    await createOrderFromInquiryAction(formData);
  };

  const updateStatus = async (formData: FormData) => {
    "use server";
    await updateOrderStatusAction(formData);
  };

  return (
    <AdminShell
      title="Orders Inbox"
      description="Операційний центр замовлень: фільтруйте, оновлюйте статуси і переходьте в картку одним кліком."
    >
      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Створити замовлення із заявки
        </h2>
        <form action={createOrder} className="mt-4 grid gap-3 md:grid-cols-2">
          <select
            name="inquiry_id"
            required
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          >
            <option value="">Оберіть заявку</option>
            {inquiries.map((inquiry) => (
              <option key={inquiry.id} value={inquiry.id}>
                {inquiry.name} · {inquiry.service_type} · {formatInquiryDate(inquiry.created_at)}
              </option>
            ))}
          </select>
          <input
            name="user_id"
            placeholder="Client user_id (optional)"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            type="date"
            name="expected_date"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <select
            name="priority"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            {Object.entries(ORDER_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            name="internal_notes"
            placeholder="Internal notes"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white md:col-span-2 md:justify-self-start"
          >
            Створити замовлення
          </button>
        </form>
      </AdminCard>

      <AdminCard>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <form className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[var(--color-text-secondary)]">Пошук</label>
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="SM-2025-001 або ID"
                className="h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--color-text-secondary)]">Статус</label>
              <select
                name="status"
                defaultValue={params.status ?? ""}
                className="h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm"
              >
                <option value="">Всі</option>
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[var(--color-text-secondary)]">Пріоритет</label>
              <select
                name="priority"
                defaultValue={params.priority ?? ""}
                className="h-10 rounded-lg border border-[var(--color-border)] px-3 text-sm"
              >
                <option value="">Всі</option>
                <option value="normal">Звичайний</option>
                <option value="urgent">Терміновий</option>
              </select>
            </div>
            <button
              type="submit"
              className="h-10 rounded-lg border border-[var(--color-border)] px-4 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
            >
              Застосувати
            </button>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/admin/inbox"
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
            >
              Smart Inbox
            </Link>
            <span className="text-xs text-[var(--color-text-secondary)]">Показано: {filteredOrders.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Order</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Priority</th>
                <th className="px-2 py-2">Expected</th>
                <th className="px-2 py-2">Quick status</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="group/row border-b border-[var(--color-border)]/60 align-top transition hover:bg-[var(--color-bg-section)]"
                >
                  <td className="px-2 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium underline">
                      {order.order_number}
                    </Link>
                    <p className="text-xs text-[var(--color-text-secondary)]">{order.id}</p>
                  </td>
                  <td className="px-2 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-2 py-3">{ORDER_PRIORITY_LABELS[order.priority]}</td>
                  <td className="px-2 py-3">{order.expected_date ?? "-"}</td>
                  <td className="px-2 py-3">
                    <form action={updateStatus} className="space-y-2">
                      <input type="hidden" name="order_id" value={order.id} />
                      <select
                        name="status"
                        defaultValue={order.status}
                        className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs"
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status}>
                            {ORDER_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="block text-xs text-[var(--color-primary)]">
                        Оновити
                      </button>
                    </form>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex justify-end">
                      <RowActions
                        actions={[
                          {
                            label: "³������",
                            href: `/admin/orders/${order.id}`,
                            icon: <Eye size={14} />,
                          },
                          {
                            label: "�����������",
                            href: `/admin/orders/${order.id}`,
                            icon: <MessageSquare size={14} />,
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminShell>
  );
}


