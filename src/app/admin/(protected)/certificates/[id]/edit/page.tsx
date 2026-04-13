import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { CertificateForm } from "@/components/admin/certificates/certificate-form";
import { getCertificateByIdForAdmin, getAllCertificatesForAdmin } from "@/lib/data/queries";

export default async function AdminCertificateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [certificate, all] = await Promise.all([
    getCertificateByIdForAdmin(id),
    getAllCertificatesForAdmin(),
  ]);

  if (!certificate) redirect("/admin/certificates");

  return (
    <AdminShell title="" bare>
      <CertificateForm initialData={certificate} totalItems={all.length} />
    </AdminShell>
  );
}
