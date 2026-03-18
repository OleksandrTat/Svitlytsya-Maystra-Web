import type { AdminAnalyticsData } from "@/lib/data/queries";

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{hint}</p>
    </article>
  );
}

export function AnalyticsSummary({ summary }: { summary: AdminAnalyticsData["summary"] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        label="Виручка"
        value={`${summary.averageCheck.toLocaleString("uk-UA")} грн`}
        hint="Середній чек завершених замовлень"
      />
      <SummaryCard
        label="Завершено"
        value={summary.completedOrders.toLocaleString("uk-UA")}
        hint="Кількість completed замовлень"
      />
      <SummaryCard
        label="Заявки"
        value={summary.inquiries.toLocaleString("uk-UA")}
        hint="Нові заявки за період"
      />
      <SummaryCard
        label="Конверсія"
        value={`${summary.conversionRate.toLocaleString("uk-UA")}%`}
        hint="Заявки у замовлення"
      />
      <SummaryCard
        label="Незавершені"
        value={summary.openFunnels.toLocaleString("uk-UA")}
        hint="Заявки без переходу в order"
      />
    </section>
  );
}
