"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DAY_WIDTH, addDays, calcBarPosition } from "@/lib/admin/gantt-utils";
import { GanttBar, type GanttOrderBar } from "@/components/admin/calendar/gantt-bar";

export type CalendarOrderItem = {
  id: string;
  orderNumber: string;
  clientName: string;
  serviceType: string;
  status: string;
  startDate: string;
  endDate: string;
  expectedDate: string | null;
};

const VIEW_OPTIONS = [
  { key: "week", label: "7 днів", days: 7 },
  { key: "twoWeeks", label: "14 днів", days: 14 },
  { key: "month", label: "30 днів", days: 30 },
] as const;

function asMidnightUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function intersects(
  orderStart: Date,
  orderEnd: Date,
  viewStart: Date,
  viewEnd: Date,
) {
  return orderStart <= viewEnd && orderEnd >= viewStart;
}

export function CalendarTimeline({ orders }: { orders: CalendarOrderItem[] }) {
  const [viewDays, setViewDays] = useState<number>(14);
  const [offsetDays, setOffsetDays] = useState<number>(0);

  const today = useMemo(() => asMidnightUTC(new Date()), []);
  const viewStart = useMemo(() => addDays(today, offsetDays), [offsetDays, today]);
  const viewEnd = useMemo(() => addDays(viewStart, viewDays - 1), [viewDays, viewStart]);

  const visibleBars = useMemo(() => {
    const mapped: GanttOrderBar[] = orders
      .map((order, index) => {
        const start = new Date(order.startDate);
        const end = new Date(order.endDate);
        if (!intersects(start, end, viewStart, viewEnd)) {
          return null;
        }
        const pos = calcBarPosition(order.startDate, order.endDate, viewStart.toISOString());

        return {
          id: order.id,
          orderNumber: order.orderNumber,
          clientName: order.clientName,
          status: order.status,
          serviceType: order.serviceType,
          left: pos.left,
          width: pos.width,
          row: index,
          expectedDate: order.expectedDate,
        };
      })
      .filter((item): item is GanttOrderBar => item !== null)
      .slice(0, 120);

    return mapped.map((item, index) => ({ ...item, row: index }));
  }, [orders, viewEnd, viewStart]);

  const gridDays = useMemo(
    () => Array.from({ length: viewDays }, (_, index) => addDays(viewStart, index)),
    [viewDays, viewStart],
  );

  const weekLoad = useMemo(() => {
    const weeks: { label: string; value: number }[] = [];
    const weekCount = Math.max(1, Math.ceil(viewDays / 7));
    for (let index = 0; index < weekCount; index += 1) {
      const start = addDays(viewStart, index * 7);
      const end = addDays(start, 6);
      const activeCount = orders.filter((order) => {
        const s = new Date(order.startDate);
        const e = new Date(order.endDate);
        return intersects(s, e, start, end);
      }).length;
      weeks.push({
        label: `${start.getUTCDate()}.${start.getUTCMonth() + 1}`,
        value: Math.min(100, Math.round((activeCount / 10) * 100)),
      });
    }
    return weeks;
  }, [orders, viewDays, viewStart]);

  const timelineWidth = viewDays * DAY_WIDTH;
  const timelineHeight = Math.max(120, visibleBars.length * 44 + 16);

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Виробничий календар</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Таймлайн активних замовлень з оцінкою завантаження.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--color-border)] p-1">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setViewDays(option.days)}
                className={`rounded px-2 py-1 text-xs ${
                  viewDays === option.days
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOffsetDays((current) => current - viewDays)}
            className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setOffsetDays((current) => current + viewDays)}
            className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <div style={{ width: timelineWidth, minWidth: "100%" }}>
          <div className="grid border-b border-[var(--color-border)]" style={{ gridTemplateColumns: `repeat(${viewDays}, minmax(0, 1fr))` }}>
            {gridDays.map((day) => (
              <div key={day.toISOString()} className="border-r border-[var(--color-border)]/50 px-1 py-2 text-center text-[11px] text-[var(--color-text-secondary)]">
                {new Intl.DateTimeFormat("uk-UA", { day: "2-digit", month: "2-digit" }).format(day)}
              </div>
            ))}
          </div>

          <div className="relative" style={{ height: timelineHeight }}>
            {visibleBars.map((bar) => (
              <GanttBar key={bar.id} order={bar} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {weekLoad.map((item) => (
          <div key={item.label} className="rounded-lg border border-[var(--color-border)] p-2">
            <p className="text-xs text-[var(--color-text-secondary)]">Тиждень {item.label}</p>
            <div className="mt-2 h-2 rounded-full bg-[var(--color-bg-section)]">
              <div
                className="h-2 rounded-full bg-[var(--color-primary)]"
                style={{ width: `${item.value}%` }}
              />
            </div>
            <p className="mt-1 text-xs font-medium text-[var(--color-text-primary)]">{item.value}%</p>
          </div>
        ))}
      </div>
    </section>
  );
}
