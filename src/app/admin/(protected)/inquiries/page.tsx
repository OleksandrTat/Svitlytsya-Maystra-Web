import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { InviteClientButton } from "@/components/admin/inquiries/invite-client-button";
import { updateInquiryStatusAction } from "@/actions/admin";
import { INQUIRY_STATUS_COLORS, INQUIRY_STATUS_LABELS } from "@/lib/constants";
import { getAllInquiriesForAdmin } from "@/lib/data/queries";
import { formatInquiryDate } from "@/lib/utils";

const statuses = [
  "new",
  "contacted",
  "quoted",
  "won",
  "lost",
  "in_progress",
  "done",
  "archived",
] as const;

export default async function AdminInquiriesPage() {
  const inquiries = await getAllInquiriesForAdmin();

  return (
    <AdminShell
      title="Заявки"
      description="Перегляд і оновлення статусів заявок без видалення."
    >
      <AdminCard>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Клієнт</th>
                <th className="px-2 py-2">Контакти</th>
                <th className="px-2 py-2">Послуга</th>
                <th className="px-2 py-2">Повідомлення</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Дії</th>
                <th className="px-2 py-2">Дата</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="border-b border-[var(--color-border)]/60 align-top">
                  <td className="px-2 py-3">
                    <p className="font-medium text-[var(--color-text-primary)]">{inquiry.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">ID: {inquiry.id}</p>
                  </td>
                  <td className="px-2 py-3">
                    <p>{inquiry.phone ?? "телефон не вказано"}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {inquiry.email ?? "email не вказано"}
                    </p>
                  </td>
                  <td className="px-2 py-3">{inquiry.service_type}</td>
                  <td className="px-2 py-3 max-w-[260px] text-xs text-[var(--color-text-secondary)]">
                    {inquiry.message ?? "-"}
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex flex-col gap-2">
                      <span
                        className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${
                          INQUIRY_STATUS_COLORS[inquiry.status]
                        }`}
                      >
                        {INQUIRY_STATUS_LABELS[inquiry.status]}
                      </span>
                      <form
                        action={
                          updateInquiryStatusAction as unknown as (formData: FormData) => Promise<void>
                        }
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="id" value={inquiry.id} />
                        <select
                          name="status"
                          defaultValue={inquiry.status}
                          className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {INQUIRY_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="text-xs text-[var(--color-primary)]">
                          Оновити
                        </button>
                      </form>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <InviteClientButton
                      inquiryId={inquiry.id}
                      inquiryName={inquiry.name}
                      inquiryEmail={inquiry.email}
                    />
                  </td>
                  <td className="px-2 py-3 text-xs text-[var(--color-text-secondary)]">
                    {formatInquiryDate(inquiry.created_at)}
                  </td>
                </tr>
              ))}
              {inquiries.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-2 py-8 text-center text-sm text-[var(--color-text-secondary)]"
                  >
                    Заявок ще немає.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
