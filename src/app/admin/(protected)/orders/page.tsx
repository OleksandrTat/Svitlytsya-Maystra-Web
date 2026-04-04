import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { CreateOrderForm } from "@/components/admin/orders/create-order-form";
import { OrdersExportButton } from "@/components/admin/orders/orders-export-button";
import { OrdersWorkspace } from "@/components/admin/orders/orders-workspace";
import { ORDER_PRIORITY_LABELS, ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  getAllInquiriesForAdmin,
  getClientsForAdmin,
  getOrderTemplatesForAdmin,
  getOrdersForAdmin,
} from "@/lib/data/queries";

export default async function AdminOrdersPage() {
  const [t, rawOrders, inquiries, clients, templates] = await Promise.all([
    getTranslations("admin.pages.orders"),
    getOrdersForAdmin(300),
    getAllInquiriesForAdmin(),
    getClientsForAdmin(500),
    getOrderTemplatesForAdmin(),
  ]);

  const inquiryMap = new Map(inquiries.map((inquiry) => [inquiry.id, inquiry]));
  const clientMap = new Map(clients.map((client) => [client.id, client]));

  const orders = rawOrders.map((order) => {
    const inquiry = order.inquiry_id ? inquiryMap.get(order.inquiry_id) : null;
    const client = order.user_id ? clientMap.get(order.user_id) : null;

    return {
      ...order,
      clientName: client?.display_name ?? inquiry?.name ?? "??????",
      serviceType: inquiry?.service_type ?? "?",
    };
  });

  const exportRows = orders.map((order) => ({
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
    <AdminShell title={t("title")} description={t("description")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <OrdersExportButton rows={exportRows} />
            <Link
              href="/admin/inbox"
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-section)]"
            >
              {t("inboxLink")}
            </Link>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {t("workspaceCount", { count: orders.length })}
          </span>
        </div>

        <CreateOrderForm inquiries={inquiries} templates={templates} />

        <OrdersWorkspace orders={orders} />
      </div>
    </AdminShell>
  );
}
