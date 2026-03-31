import { AdminShell } from "@/components/admin/admin-shell";
import { getAllCertificatesForAdmin } from "@/lib/data/queries";
import { CertificatesAdminClient } from "@/components/admin/certificates/certificates-admin-client";

export default async function AdminCertificatesPage() {
  const certificates = await getAllCertificatesForAdmin();

  return (
    <AdminShell
      title="Сертифікати"
      description="Керування сертифікатами та нагородами."
    >
      <CertificatesAdminClient certificates={certificates} />
    </AdminShell>
  );
}
