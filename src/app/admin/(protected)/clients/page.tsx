import Link from "next/link";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { getClientsForAdmin } from "@/lib/data/queries";

export default async function AdminClientsPage() {
  const clients = await getClientsForAdmin(300);

  return (
    <AdminShell title="Clients" description="Клієнтська база та активність в платформі.">
      <AdminCard>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Client</th>
                <th className="px-2 py-2">Types</th>
                <th className="px-2 py-2">Orders</th>
                <th className="px-2 py-2">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-[var(--color-border)]/60">
                  <td className="px-2 py-2">
                    <Link href={`/admin/clients/${client.id}`} className="font-medium underline">
                      {client.display_name ?? "Unnamed"}
                    </Link>
                    <p className="text-xs text-[var(--color-text-secondary)]">{client.id}</p>
                  </td>
                  <td className="px-2 py-2">{client.account_types.join(", ") || "-"}</td>
                  <td className="px-2 py-2">{client.orders_count}</td>
                  <td className="px-2 py-2">{new Date(client.last_seen_at).toLocaleString("uk-UA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
