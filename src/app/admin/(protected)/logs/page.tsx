import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { getActivityLogsForAdmin } from "@/lib/data/queries";
import { formatInquiryDate } from "@/lib/utils";

export default async function AdminLogsPage() {
  const logs = await getActivityLogsForAdmin(200);

  return (
    <AdminShell
      title="Журнал дій"
      description="Історія create/update/delete операцій у системі."
    >
      <AdminCard>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Дія</th>
                <th className="px-2 py-2">Об’єкт</th>
                <th className="px-2 py-2">ID</th>
                <th className="px-2 py-2">Дата</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--color-border)]/60">
                  <td className="px-2 py-2">{log.action}</td>
                  <td className="px-2 py-2">{log.entity}</td>
                  <td className="px-2 py-2 text-xs text-[var(--color-text-secondary)]">{log.entity_id ?? "-"}</td>
                  <td className="px-2 py-2 text-xs text-[var(--color-text-secondary)]">{formatInquiryDate(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Логів поки немає або Supabase ще не підключений.</p>
        ) : null}
      </AdminCard>
    </AdminShell>
  );
}

