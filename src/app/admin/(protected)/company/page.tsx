import { AdminShell } from "@/components/admin/admin-shell";
import { CompanySettingsClient } from "@/components/admin/company/company-settings-client";
import { getCompanyInfoForAdmin } from "@/lib/data/queries";

export default async function AdminCompanyPage() {
  const company = await getCompanyInfoForAdmin();

  if (!company) {
    return (
      <AdminShell title="Компанія" description="Профіль компанії, контакти та соціальні мережі.">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Не вдалося завантажити дані компанії.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Компанія"
      description="Керуйте профілем компанії, контактами, графіком роботи та соціальними мережами."
    >
      <CompanySettingsClient company={company} />
    </AdminShell>
  );
}
