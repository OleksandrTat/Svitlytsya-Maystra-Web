import Link from "next/link";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAllInvoicesForAdmin, getRevenueStatsForAdmin } from "@/lib/data/queries";
import { formatInquiryDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  draft: "Чернетка",
  sent: "Надіслано",
  paid: "Оплачено",
  partial: "Часткова",
  overdue: "Прострочено",
  cancelled: "Скасовано",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700",
  sent: "bg-sky-100 text-sky-800",
  paid: "bg-green-100 text-green-800",
  partial: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-zinc-100 text-zinc-500",
};

export default async function AdminInvoicesPage() {
  const [invoices, stats] = await Promise.all([
    getAllInvoicesForAdmin(),
    getRevenueStatsForAdmin(),
  ]);

  return (
    <AdminShell
      title="Рахунки"
      description="Управління рахунками, відстеження оплат та боргів."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Виставлено", value: stats.totalInvoiced, color: "text-[var(--color-primary)]" },
          { label: "Оплачено", value: stats.totalPaid, color: "text-green-700" },
          { label: "Прострочено", value: stats.totalOverdue, color: "text-red-700" },
          { label: "Чернетки", value: stats.totalDraft, color: "text-zinc-500" },
        ].map((card) => (
          <AdminCard key={card.label} className="p-4">
            <p className="text-xs text-[var(--color-text-secondary)]">{card.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${card.color}`}>
              {Math.round(card.value).toLocaleString("uk-UA")} грн
            </p>
          </AdminCard>
        ))}
      </div>

      <AdminCard>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Номер</th>
                <th className="px-2 py-2">Замовлення</th>
                <th className="px-2 py-2">Клієнт</th>
                <th className="px-2 py-2">Сума</th>
                <th className="px-2 py-2">Оплачено</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Дедлайн</th>
                <th className="px-2 py-2">Виставлено</th>
                <th className="px-2 py-2">Дії</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-[var(--color-border)]/60 align-top">
                  <td className="px-2 py-3 font-mono text-xs">{invoice.invoice_number}</td>
                  <td className="px-2 py-3">
                    <Link
                      href={`/admin/orders/${invoice.order_id}`}
                      className="underline text-[var(--color-primary)]"
                    >
                      {invoice.order_number}
                    </Link>
                  </td>
                  <td className="px-2 py-3">{invoice.client_name}</td>
                  <td className="px-2 py-3 font-semibold">
                    {invoice.total.toLocaleString("uk-UA")} грн
                  </td>
                  <td className="px-2 py-3 text-green-700">
                    {invoice.paid_amount > 0
                      ? `${invoice.paid_amount.toLocaleString("uk-UA")} грн`
                      : "—"}
                  </td>
                  <td className="px-2 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        STATUS_COLORS[invoice.status] ?? ""
                      }`}
                    >
                      {STATUS_LABELS[invoice.status] ?? invoice.status}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-xs text-[var(--color-text-secondary)]">
                    {invoice.due_date
                      ? new Date(invoice.due_date).toLocaleDateString("uk-UA")
                      : "—"}
                  </td>
                  <td className="px-2 py-3 text-xs text-[var(--color-text-secondary)]">
                    {formatInquiryDate(invoice.issued_at)}
                  </td>
                  <td className="px-2 py-3">
                    <Link
                      href={`/admin/orders/${invoice.order_id}`}
                      className="text-xs underline"
                    >
                      Замовлення
                    </Link>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-2 py-8 text-center text-sm text-[var(--color-text-secondary)]"
                  >
                    Рахунків ще немає.
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
