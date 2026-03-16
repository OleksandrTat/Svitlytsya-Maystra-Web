import { CheckCircle2 } from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import type { OrderStatus, OrderStatusHistory } from "@/lib/types";
import { formatInquiryDate } from "@/lib/utils";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 size={18} className="text-green-600" />,
  archived: <CheckCircle2 size={18} className="text-zinc-400" />,
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "border-zinc-300 bg-zinc-50",
  consulting: "border-sky-300 bg-sky-50",
  design: "border-indigo-300 bg-indigo-50",
  approved: "border-violet-300 bg-violet-50",
  production: "border-amber-300 bg-amber-50",
  ready: "border-emerald-300 bg-emerald-50",
  installation: "border-emerald-400 bg-emerald-50",
  completed: "border-green-400 bg-green-50",
  archived: "border-zinc-200 bg-zinc-50",
};

export function OrderTimeline({ items }: { items: OrderStatusHistory[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-secondary)]">Таймлайн поки порожній.</p>
    );
  }

  return (
    <ol className="relative space-y-0">
      <div className="absolute bottom-4 left-[22px] top-4 w-0.5 bg-[var(--color-border)]" />

      {items.map((item) => (
        <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
          <div
            className={`relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 ${
              STATUS_COLORS[item.to_status] ?? "border-zinc-300 bg-zinc-50"
            }`}
          >
            {STATUS_ICONS[item.to_status] ?? (
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />
            )}
          </div>

          <div
            className={`flex-1 rounded-2xl border p-4 ${
              STATUS_COLORS[item.to_status] ?? ""
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {ORDER_STATUS_LABELS[item.to_status]}
              </p>
              <time className="whitespace-nowrap text-xs text-[var(--color-text-secondary)]">
                {formatInquiryDate(item.created_at)}
              </time>
            </div>
            {item.comment && (
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{item.comment}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
