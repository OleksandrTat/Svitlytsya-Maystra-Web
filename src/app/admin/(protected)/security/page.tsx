import { getTranslations } from "next-intl/server";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSecurityMfa } from "@/components/admin/admin-security-mfa";

export default async function AdminSecurityPage() {
  const t = await getTranslations("admin.pages.security");

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t("mfaTitle")}</h2>
        <div className="mt-3">
          <AdminSecurityMfa />
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t("checklistTitle")}</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">
          <li>{t("checklistMfa")}</li>
          <li>{t("checklistTurnstile")}</li>
          <li>{t("checklistSignedUrls")}</li>
          <li>{t("checklistBackup")}</li>
        </ul>
      </AdminCard>
    </AdminShell>
  );
}
