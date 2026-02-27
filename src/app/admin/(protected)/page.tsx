import Link from "next/link";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { formatInquiryDate } from "@/lib/utils";
import { INQUIRY_STATUS_LABELS } from "@/lib/constants";
import { getDashboardStats, getRecentInquiries } from "@/lib/data/queries";

export default async function AdminDashboardPage() {
  const [stats, recentInquiries] = await Promise.all([
    getDashboardStats(),
    getRecentInquiries(5),
  ]);

  return (
    <AdminShell
      title="Dashboard"
      description="Огляд ключових показників та останніх заявок"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <AdminCard>
          <p className="text-sm text-[var(--color-text-secondary)]">Проєкти</p>
          <p className="mt-2 font-display text-4xl text-[var(--color-primary)]">{stats.totalProjects}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-sm text-[var(--color-text-secondary)]">Нові заявки сьогодні</p>
          <p className="mt-2 font-display text-4xl text-[var(--color-primary)]">{stats.newInquiriesToday}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-sm text-[var(--color-text-secondary)]">Всього заявок</p>
          <p className="mt-2 font-display text-4xl text-[var(--color-primary)]">{stats.totalInquiries}</p>
        </AdminCard>
      </div>

      <AdminCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Швидкі дії</h2>
          <div className="flex gap-2">
            <Link href="/admin/projects" className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]">
              Додати проєкт
            </Link>
            <Link href="/admin/inquiries" className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]">
              Переглянути заявки
            </Link>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Останні заявки</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">ім’я</th>
                <th className="px-2 py-2">Послуга</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Дата</th>
              </tr>
            </thead>
            <tbody>
              {recentInquiries.map((inquiry) => (
                <tr key={inquiry.id} className="border-b border-[var(--color-border)]/60">
                  <td className="px-2 py-2">{inquiry.name}</td>
                  <td className="px-2 py-2">{inquiry.service_type}</td>
                  <td className="px-2 py-2">{INQUIRY_STATUS_LABELS[inquiry.status]}</td>
                  <td className="px-2 py-2">{formatInquiryDate(inquiry.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminShell>
  );
}

