"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsRevenuePoint } from "@/lib/data/queries";

export function RevenueChart({ data }: { data: AnalyticsRevenuePoint[] }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          Виручка та завершені замовлення
        </h3>
      </header>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1A4F8A" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#1A4F8A" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#718096" }} />
          <YAxis
            tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            tick={{ fontSize: 12, fill: "#718096" }}
          />
          <Tooltip
            formatter={(value: number | undefined, key) => {
              const amount = Number(value ?? 0);
              if (key === "orders") {
                return [`${amount} шт`, "Замовлення"];
              }
              return [`${amount.toLocaleString("uk-UA")} грн`, "Виручка"];
            }}
            contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Виручка"
            stroke="#1A4F8A"
            strokeWidth={2.5}
            fill="url(#revenue-grad)"
          />
          <Line
            type="monotone"
            dataKey="orders"
            name="Замовлення"
            stroke="#C07B2A"
            strokeWidth={2}
            dot={{ r: 2.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}
