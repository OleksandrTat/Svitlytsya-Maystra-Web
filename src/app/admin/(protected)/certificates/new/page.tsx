import { AdminShell } from "@/components/admin/admin-shell";
import { CertificateForm } from "@/components/admin/certificates/certificate-form";
import { getAllCertificatesForAdmin } from "@/lib/data/queries";

export default async function AdminCertificateNewPage() {
  const certificates = await getAllCertificatesForAdmin();

  return (
    <AdminShell title="" bare>
      <CertificateForm totalItems={certificates.length} />
    </AdminShell>
  );
}
