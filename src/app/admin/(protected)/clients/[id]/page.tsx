import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { ClientExportButton } from "@/components/admin/clients/client-export-button";
import { getClientsForAdmin, getOrdersForAdmin } from "@/lib/data/queries";
import { ORDER_PRIORITY_LABELS, ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatInquiryDate } from "@/lib/utils";

type Params = {
  id: string;
};

export default async function AdminClientDetailsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const [clients, orders] = await Promise.all([getClientsForAdmin(500), getOrdersForAdmin(500)]);

  const client = clients.find((item) => item.id === id) ?? null;
  const clientOrders = orders.filter((order) => order.user_id === id);

  if (!client) {
    return (
      <AdminShell title="Client Not Found">
        <AdminCard>
          <p className="text-sm text-[var(--color-text-secondary)]">Client does not exist.</p>
        </AdminCard>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={client.display_name ?? "Client"} description={client.id}>
      <div className="flex justify-end">
        <ClientExportButton
          clientName={client.display_name ?? "Client"}
          clientId={client.id}
          rows={clientOrders.map((order) => ({
            order_number: order.order_number,
            status: ORDER_STATUS_LABELS[order.status],
            priority: ORDER_PRIORITY_LABELS[order.priority],
            expected_date: order.expected_date ?? "",
            created_at: formatInquiryDate(order.created_at),
          }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Profile</h2>
          <dl className="mt-4 grid gap-3 text-sm text-[var(--color-text-secondary)]">
            <div>
              <dt className="font-semibold text-[var(--color-text-primary)]">Account types</dt>
              <dd>{client.account_types.join(", ") || "-"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--color-text-primary)]">Created</dt>
              <dd>{formatInquiryDate(client.created_at)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--color-text-primary)]">Last seen</dt>
              <dd>{formatInquiryDate(client.last_seen_at)}</dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Orders</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {clientOrders.map((order) => (
              <li key={order.id} className="rounded-xl border border-[var(--color-border)] p-3">
                <p className="font-semibold">{order.order_number}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {ORDER_STATUS_LABELS[order.status]} · {formatInquiryDate(order.created_at)}
                </p>
              </li>
            ))}
            {clientOrders.length === 0 ? (
              <li className="text-sm text-[var(--color-text-secondary)]">No linked orders yet.</li>
            ) : null}
          </ul>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
