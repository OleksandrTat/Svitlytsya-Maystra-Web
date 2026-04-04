import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { ClientsList } from "@/components/admin/clients/clients-list";
import { getClientsForAdmin } from "@/lib/data/queries";

export default async function AdminClientsPage() {
  const [t, clients] = await Promise.all([
    getTranslations("admin.pages.clients"),
    getClientsForAdmin(500),
  ]);

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <ClientsList clients={clients} />
    </AdminShell>
  );
}
