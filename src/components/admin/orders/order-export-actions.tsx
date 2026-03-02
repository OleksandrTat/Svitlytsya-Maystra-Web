"use client";

import { FileDown, Printer } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import { OrderPDF, type OrderPdfModel } from "@/components/admin/orders/order-pdf";

function printLabel(order: OrderPdfModel) {
  const content = `
    <html>
      <head>
        <title>${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #1A202C; }
          .label { width: 420px; border: 1px solid #CBD5E0; border-radius: 10px; padding: 16px; }
          .title { font-size: 18px; color: #1A4F8A; font-weight: 700; margin-bottom: 12px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="title">Svitlytsya Maystra</div>
          <div class="row"><strong>Order:</strong><span>${order.orderNumber}</span></div>
          <div class="row"><strong>Client:</strong><span>${order.clientName}</span></div>
          <div class="row"><strong>Service:</strong><span>${order.serviceType}</span></div>
          <div class="row"><strong>Status:</strong><span>${order.status}</span></div>
          <div class="row"><strong>Expected:</strong><span>${order.expectedDate ?? "-"}</span></div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=520,height=720");
  if (!printWindow) {
    toast.error("Не вдалося відкрити вікно друку.");
    return;
  }
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function OrderExportActions({ order }: { order: OrderPdfModel }) {
  const onDownloadPdf = async () => {
    try {
      const blob = await pdf(<OrderPDF order={order} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("PDF згенеровано.");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Не вдалося згенерувати PDF.");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onDownloadPdf}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
      >
        <FileDown size={16} />
        PDF
      </button>
      <button
        type="button"
        onClick={() => printLabel(order)}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
      >
        <Printer size={16} />
        Друк
      </button>
    </div>
  );
}
