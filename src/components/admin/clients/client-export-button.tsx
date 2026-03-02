"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/admin/export";

type ClientOrderExportRow = {
  order_number: string;
  status: string;
  priority: string;
  expected_date: string;
  created_at: string;
};

export function ClientExportButton({
  clientName,
  clientId,
  rows,
}: {
  clientName: string;
  clientId: string;
  rows: ClientOrderExportRow[];
}) {
  const onExport = () => {
    exportToCSV(
      rows,
      [
        { key: "order_number", label: "Номер" },
        { key: "status", label: "Статус" },
        { key: "priority", label: "Пріоритет" },
        { key: "expected_date", label: "Очікувана дата" },
        { key: "created_at", label: "Створено" },
      ],
      `client-${clientId}`,
    );
    toast.success(`Експортовано дані клієнта ${clientName}.`);
  };

  return (
    <button
      type="button"
      onClick={onExport}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
    >
      <Download size={16} />
      Експорт клієнта CSV
    </button>
  );
}
