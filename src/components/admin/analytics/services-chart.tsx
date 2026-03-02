"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { AnalyticsServicePoint } from "@/lib/data/queries";

const COLORS = ["#1A4F8A", "#C07B2A", "#276749", "#2C7A7B", "#553C9A", "#4A5568"];

export function ServicesChart({ data }: { data: AnalyticsServicePoint[] }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">
        Розподіл послуг
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell key={`slice-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => [
              `${Number(value ?? 0)} замовлень`,
              "Кількість",
            ]}
          />
          <Legend iconType="circle" iconSize={10} />
        </PieChart>
      </ResponsiveContainer>
    </section>
  );
}
