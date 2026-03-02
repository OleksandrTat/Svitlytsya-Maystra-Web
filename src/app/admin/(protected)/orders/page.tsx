import Link from "next/link";
import { Eye, MessageSquare } from "lucide-react";
import { createSupabaseServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { updateOrderStatusAction } from "@/actions/orders";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { RowActions } from "@/components/admin/shared/row-actions";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrdersMobileList } from "@/components/admin/orders/orders-mobile-list";
import { OrdersExportButton } from "@/components/admin/orders/orders-export-button";
import { CreateOrderForm } from "@/components/admin/orders/create-order-form";
import { ORDER_PRIORITY_LABELS, ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  getAllInquiriesForAdmin,
  getOrderTemplatesForAdmin,
  getOrdersForAdmin,
} from "@/lib/data/queries";
import type { Order, OrderStatus } from "@/lib/types";

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

type OrderAmountRow = {
  order_id: string;
  total: number;
  created_at: string;
};

async function getLatestOrderTotals() {
  const db = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!db) {
    return new Map<string, number>();
  }

  const { data } = await db
    .from("order_calculations")
    .select("order_id, total, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  const map = new Map<string, number>();
  for (const row of (data ?? []) as OrderAmountRow[]) {
    if (!map.has(row.order_id)) {
      map.set(row.order_id, Number(row.total) || 0);
    }
  }
  return map;
}

type EnrichedOrder = Order & {
  clientName: string;
  serviceType: string;
  amount: number | null;
};

function applyOrderFilters(
  orders: EnrichedOrder[],
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
        order.id.toLowerCase().includes(query) ||
        order.clientName.toLowerCase().includes(query),
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
  const [orders, inquiries, templates, totalsMap] = await Promise.all([
    getOrdersForAdmin(500),
    getAllInquiriesForAdmin(),
    getOrderTemplatesForAdmin(),
    getLatestOrderTotals(),
  ]);

  const inquiryMap = new Map(inquiries.map((inquiry) => [inquiry.id, inquiry]));

  const enrichedOrders: EnrichedOrder[] = orders.map((order) => {
    const inquiry = order.inquiry_id ? inquiryMap.get(order.inquiry_id) : null;
    return {
      ...order,
      clientName: inquiry?.name ?? "Клієнт",
      serviceType: inquiry?.service_type ?? "Невідомо",
      amount: totalsMap.get(order.id) ?? null,
    };
  });

  const filteredOrders = applyOrderFilters(enrichedOrders, params);

  const updateStatus = async (formData: FormData) => {
    "use server";
    await updateOrderStatusAction(formData);
  };

  const exportRows = filteredOrders.map((order) => ({
    order_number: order.order_number,
    status: ORDER_STATUS_LABELS[order.status],
    priority: ORDER_PRIORITY_LABELS[order.priority],
    expected_date: order.expected_date ?? "",
    created_at: new Intl.DateTimeFormat("uk-UA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(order.created_at)),
    client_name: order.clientName,
    service_type: order.serviceType,
  }));

  return (
    <AdminShell
      title="Orders Inbox"
      description="Операційний центр замовлень з фільтрами, шаблонами та експортом."
    >
      <CreateOrderForm inquiries={inquiries} templates={templates} />

      <AdminCard>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <form className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[var(--color-text-secondary)]">Пошук</label>
              <input
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Номер, ID або клієнт"
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
            <OrdersExportButton rows={exportRows} />
            <Link
              href="/admin/inbox"
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
            >
              Smart Inbox
            </Link>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Показано: {filteredOrders.length}
            </span>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Order</th>
                <th className="px-2 py-2">Клієнт</th>
                <th className="px-2 py-2">Послуга</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Priority</th>
                <th className="px-2 py-2">Сума</th>
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
                  <td className="px-2 py-3">{order.clientName}</td>
                  <td className="px-2 py-3">{order.serviceType}</td>
                  <td className="px-2 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-2 py-3">{ORDER_PRIORITY_LABELS[order.priority]}</td>
                  <td className="px-2 py-3">
                    {order.amount !== null ? `${Math.round(order.amount).toLocaleString("uk-UA")} грн` : "-"}
                  </td>
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
                            label: "Відкрити",
                            href: `/admin/orders/${order.id}`,
                            icon: <Eye size={14} />,
                          },
                          {
                            label: "Повідомлення",
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

        <div className="md:hidden">
          <OrdersMobileList
            orders={filteredOrders.map((order) => ({
              id: order.id,
              orderNumber: order.order_number,
              status: order.status,
              clientName: order.clientName,
              serviceType: order.serviceType,
              amount: order.amount,
              createdAt: order.created_at,
            }))}
          />
        </div>
      </AdminCard>
    </AdminShell>
  );
}
