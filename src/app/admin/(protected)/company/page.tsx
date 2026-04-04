import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { CompanySettingsClient } from "@/components/admin/company/company-settings-client";
import { getCompanyInfoForAdmin } from "@/lib/data/queries";

export default async function AdminCompanyPage() {
  const [t, company] = await Promise.all([
    getTranslations("admin.pages.company"),
    getCompanyInfoForAdmin(),
  ]);

  if (!company) {
    return (
      <AdminShell title={t("title")} description={t("description")}>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {t("loadError")}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <CompanySettingsClient company={company} />
    </AdminShell>
  );
}
