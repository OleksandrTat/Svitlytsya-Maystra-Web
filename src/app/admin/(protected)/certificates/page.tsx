import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAllCertificatesForAdmin } from "@/lib/data/queries";
import { CertificatesAdminClient } from "@/components/admin/certificates/certificates-admin-client";

export default async function AdminCertificatesPage() {
  const [t, certificates] = await Promise.all([
    getTranslations("admin.pages.certificates"),
    getAllCertificatesForAdmin(),
  ]);

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <CertificatesAdminClient certificates={certificates} />
    </AdminShell>
  );
}
