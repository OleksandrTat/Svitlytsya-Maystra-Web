import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { ServicesAdminClient } from "@/components/admin/services/services-admin-client";
import { getAllServicesForAdmin } from "@/lib/data/queries";

export default async function AdminServicesPage() {
  const [t, services] = await Promise.all([
    getTranslations("admin.pages.services"),
    getAllServicesForAdmin(),
  ]);

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <ServicesAdminClient services={services} />
    </AdminShell>
  );
}
