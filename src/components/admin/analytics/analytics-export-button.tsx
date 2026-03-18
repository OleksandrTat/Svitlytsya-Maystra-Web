"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/admin/export";
import type { AnalyticsRevenuePoint } from "@/lib/data/queries";

export function AnalyticsExportButton({ revenue }: { revenue: AnalyticsRevenuePoint[] }) {
  const onExport = () => {
    if (revenue.length === 0) {
      toast.info("Немає даних для експорту.");
      return;
    }

    exportToCSV(
      revenue.map((item) => ({
        month: item.month,
        revenue: item.revenue,
        orders: item.orders,
      })),
      [
        { key: "month", label: "Місяць" },
        { key: "revenue", label: "Виручка" },
        { key: "orders", label: "Замовлення" },
      ],
      "analytics-report",
    );
    toast.success("CSV звіт сформовано.");
  };

  return (
    <button
      type="button"
      onClick={onExport}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-section)]"
    >
      <Download size={16} />
      Завантажити CSV
    </button>
  );
}
