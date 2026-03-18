import { AdminShell } from "@/components/admin/admin-shell";
import { ClientsList } from "@/components/admin/clients/clients-list";
import { getClientsForAdmin } from "@/lib/data/queries";

export default async function AdminClientsPage() {
  const clients = await getClientsForAdmin(500);
  return (
    <AdminShell title="Клієнти" description="CRM: активність, сегменти, замовлення.">
      <ClientsList clients={clients as any} />
    </AdminShell>
  );
}
