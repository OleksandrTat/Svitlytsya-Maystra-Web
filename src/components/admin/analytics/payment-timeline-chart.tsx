"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PaymentTimelinePoint } from "@/lib/data/queries";

export function PaymentTimelineChart({
  data,
}: {
  data: PaymentTimelinePoint[];
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">
        Виставлено vs Оплачено
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#718096" }} />
          <YAxis
            tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`}
            tick={{ fontSize: 11, fill: "#718096" }}
          />
          <Tooltip
            formatter={(value, key) => [
              `${Number(value).toLocaleString("uk-UA")} грн`,
              key === "invoiced" ? "Виставлено" : key === "paid" ? "Оплачено" : "Прострочено",
            ]}
            contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }}
          />
          <Legend
            formatter={(key) =>
              key === "invoiced" ? "Виставлено" : key === "paid" ? "Оплачено" : "Прострочено"
            }
          />
          <Bar dataKey="invoiced" fill="#2B6CB0" radius={[4, 4, 0, 0]} />
          <Bar dataKey="paid" fill="#276749" radius={[4, 4, 0, 0]} />
          <Bar dataKey="overdue" fill="#C53030" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
