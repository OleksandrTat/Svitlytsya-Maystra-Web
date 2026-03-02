import { AdminShell } from "@/components/admin/admin-shell";
import { AnalyticsSummary } from "@/components/admin/analytics/analytics-summary";
import { RevenueChart } from "@/components/admin/analytics/revenue-chart";
import { ServicesChart } from "@/components/admin/analytics/services-chart";
import { TopClientsTable } from "@/components/admin/analytics/top-clients-table";
import { AnalyticsExportButton } from "@/components/admin/analytics/analytics-export-button";
import { getAdminAnalyticsData } from "@/lib/data/queries";

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalyticsData(12);

  return (
    <AdminShell
      title="Analytics"
      description="Звіти по виручці, замовленнях, послугах і конверсії."
    >
      <div className="flex justify-end">
        <AnalyticsExportButton revenue={analytics.revenue} />
      </div>

      <AnalyticsSummary summary={analytics.summary} />

      <section className="grid gap-4 xl:grid-cols-2">
        <RevenueChart data={analytics.revenue} />
        <ServicesChart data={analytics.services} />
      </section>

      <TopClientsTable clients={analytics.topClients} />
    </AdminShell>
  );
}
