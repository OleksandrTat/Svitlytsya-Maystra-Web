"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LoadPoint = { week: string; active: number; load: number };

export function ProductionLoadChart({ data }: { data: LoadPoint[] }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">
        Завантаження виробництва
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#718096" }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "#718096" }}
            label={{ value: "Замовлень", angle: -90, position: "insideLeft", fontSize: 10 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "#718096" }}
            label={{ value: "%", angle: 90, position: "insideRight", fontSize: 10 }}
          />
          <Tooltip
            formatter={(value, key) => [
              key === "active" ? `${value} замовлень` : `${value}%`,
              key === "active" ? "Активні" : "Завантаженість",
            ]}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="active"
            stroke="#1A4F8A"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="load"
            stroke="#C07B2A"
            strokeWidth={2}
            strokeDasharray="4 2"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}
