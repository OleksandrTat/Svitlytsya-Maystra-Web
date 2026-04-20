import { getTranslations } from "next-intl/server";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAuditLogForAdmin } from "@/lib/data/queries";
import { formatInquiryDate } from "@/lib/utils";

export default async function AdminAuditLogPage() {
  const [t, auditRecords] = await Promise.all([
    getTranslations("admin.pages.auditLog"),
    getAuditLogForAdmin(500),
  ]);

  type UnifiedRow = {
    id: string;
    action: string;
    table_name: string;
    actor: string;
    record_id: string | null;
    created_at: string;
    source: "audit";
  };

  const unified: UnifiedRow[] = auditRecords.map((record) => ({
    id: record.id,
    action: record.action,
    table_name: record.table_name,
    actor: record.actor_type,
    record_id: record.record_id ?? null,
    created_at: record.created_at,
    source: "audit" as const,
  }));

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <AdminCard>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">{t("colAction")}</th>
                <th className="px-2 py-2">{t("colTable")}</th>
                <th className="px-2 py-2">{t("colActor")}</th>
                <th className="px-2 py-2">{t("colRecordId")}</th>
                <th className="px-2 py-2">{t("colSource")}</th>
                <th className="px-2 py-2">{t("colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {unified.map((row) => (
                <tr key={`${row.source}-${row.id}`} className="border-b border-[var(--color-border)]/60">
                  <td className="px-2 py-2">{row.action}</td>
                  <td className="px-2 py-2">{row.table_name}</td>
                  <td className="px-2 py-2">{row.actor}</td>
                  <td className="px-2 py-2 font-mono text-xs text-[var(--color-text-secondary)]">
                    {row.record_id ? `${row.record_id.slice(0, 8)}...` : "—"}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        row.source === "audit"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {row.source}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-[var(--color-text-secondary)]">
                    {formatInquiryDate(row.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
