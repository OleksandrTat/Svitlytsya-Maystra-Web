import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAuditLogForAdmin } from "@/lib/data/queries";
import { formatInquiryDate } from "@/lib/utils";

export default async function AdminAuditLogPage() {
  const records = await getAuditLogForAdmin(500);

  return (
    <AdminShell
      title="Audit Log"
      description="Незмінний журнал критичних операцій в системі."
    >
      <AdminCard>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Action</th>
                <th className="px-2 py-2">Table</th>
                <th className="px-2 py-2">Actor</th>
                <th className="px-2 py-2">Record</th>
                <th className="px-2 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-[var(--color-border)]/60">
                  <td className="px-2 py-2">{record.action}</td>
                  <td className="px-2 py-2">{record.table_name}</td>
                  <td className="px-2 py-2">{record.actor_type}</td>
                  <td className="px-2 py-2 text-xs">{record.record_id ?? "-"}</td>
                  <td className="px-2 py-2 text-xs">{formatInquiryDate(record.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
