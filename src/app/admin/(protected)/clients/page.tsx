import { AdminShell } from "@/components/admin/admin-shell";
import { ClientsList } from "@/components/admin/clients/clients-list";
import { getClientsForAdmin } from "@/lib/data/queries";

export default async function AdminClientsPage() {
  const clients = await getClientsForAdmin(500);

  return (
    <AdminShell
      title="Клієнти"
      description="CRM-список з активністю, сегментами та швидким переходом у профіль клієнта."
    >
      <ClientsList clients={clients} />
    </AdminShell>
  );
}
