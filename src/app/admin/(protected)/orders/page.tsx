import Link from "next/link";
import { createOrderFromInquiryAction, updateOrderStatusAction } from "@/actions/orders";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { ORDER_PRIORITY_LABELS } from "@/lib/constants";
import { getAllInquiriesForAdmin, getOrdersForAdmin } from "@/lib/data/queries";
import type { OrderStatus } from "@/lib/types";
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

export default async function AdminOrdersPage() {
  const [orders, inquiries] = await Promise.all([getOrdersForAdmin(200), getAllInquiriesForAdmin()]);

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
      description="Операційний центр замовлень: створення із заявок, статуси, пріоритет."
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
            className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white md:col-span-2 md:justify-self-start"
          >
            Створити замовлення
          </button>
        </form>
      </AdminCard>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Inbox</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Order</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Priority</th>
                <th className="px-2 py-2">Expected</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-[var(--color-border)]/60 align-top">
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
                            {status}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="block text-xs text-[var(--color-primary)]">
                        Update
                      </button>
                    </form>
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
