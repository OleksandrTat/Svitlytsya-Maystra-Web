"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/admin/export";

export type OrdersExportRow = {
  order_number: string;
  status: string;
  priority: string;
  expected_date: string;
  created_at: string;
  client_name: string;
  service_type: string;
};

export function OrdersExportButton({ rows }: { rows: OrdersExportRow[] }) {
  const onExport = () => {
    if (rows.length === 0) {
      toast.info("Немає замовлень для експорту.");
      return;
    }

    exportToCSV(
      rows,
      [
        { key: "order_number", label: "Номер" },
        { key: "status", label: "Статус" },
        { key: "priority", label: "Пріоритет" },
        { key: "expected_date", label: "Очікувана дата" },
        { key: "client_name", label: "Клієнт" },
        { key: "service_type", label: "Послуга" },
        { key: "created_at", label: "Створено" },
      ],
      "orders",
    );
    toast.success("CSV збережено.");
  };

  return (
    <button
      type="button"
      onClick={onExport}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-section)]"
    >
      <Download size={16} />
      Експорт CSV
    </button>
  );
}
