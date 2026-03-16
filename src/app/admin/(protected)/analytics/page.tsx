import { AdminShell } from "@/components/admin/admin-shell";
import { AnalyticsSummary } from "@/components/admin/analytics/analytics-summary";
import { RevenueChart } from "@/components/admin/analytics/revenue-chart";
import { ServicesChart } from "@/components/admin/analytics/services-chart";
import { TopClientsTable } from "@/components/admin/analytics/top-clients-table";
import { FunnelChart } from "@/components/admin/analytics/funnel-chart";
import { PaymentTimelineChart } from "@/components/admin/analytics/payment-timeline-chart";
import { ProductionLoadChart } from "@/components/admin/analytics/production-load-chart";
import { TopProductsChart } from "@/components/admin/analytics/top-products-chart";
import { AnalyticsExportButton } from "@/components/admin/analytics/analytics-export-button";
import { getAdminAnalyticsDataV2 } from "@/lib/data/queries";

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalyticsDataV2(12);

  return (
    <AdminShell
      title="Analytics"
      description="Виручка, воронка продажів, завантаження виробництва та топ-продукти."
    >
      <div className="flex justify-end">
        <AnalyticsExportButton revenue={analytics.revenue} />
      </div>

      <AnalyticsSummary summary={analytics.summary} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Середній час до оплати</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
            {analytics.avgDaysToPayment} дн.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Повторні клієнти</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
            {analytics.repeatClientsCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">Прострочені рахунки</p>
          <p className="mt-2 text-2xl font-semibold text-red-700">
            {analytics.revenueStats.overdueCount}
          </p>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <PaymentTimelineChart data={analytics.paymentTimeline} />
        <FunnelChart data={analytics.funnel} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <RevenueChart data={analytics.revenue} />
        <ServicesChart data={analytics.services} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ProductionLoadChart data={analytics.productionLoad} />
        <TopProductsChart data={analytics.topProducts} />
      </section>

      <TopClientsTable clients={analytics.topClients} />
    </AdminShell>
  );
}
