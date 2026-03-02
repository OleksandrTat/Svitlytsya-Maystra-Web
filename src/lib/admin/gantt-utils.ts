import type { Order } from "@/lib/types";

export const DAY_WIDTH = 36;

export function calcBarPosition(
  startDate: string,
  endDate: string,
  viewStartDate: string,
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const viewStart = new Date(viewStartDate);

  const startDay = Math.round(
    (start.getTime() - viewStart.getTime()) / 86_400_000,
  );
  const duration = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
  );

  return {
    left: startDay * DAY_WIDTH,
    width: duration * DAY_WIDTH,
  };
}

export function calcWeekLoad(orders: Order[], weekStart: Date): number {
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);

  const active = orders.filter((order) => {
    const start = new Date(order.created_at);
    const end = new Date(order.expected_date ?? order.created_at);
    return start < weekEnd && end > weekStart;
  });

  return Math.max(0, Math.min(100, Math.round((active.length / 10) * 100)));
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}
