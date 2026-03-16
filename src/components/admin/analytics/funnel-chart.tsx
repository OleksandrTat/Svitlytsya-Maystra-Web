"use client";

import type { FunnelStep } from "@/lib/data/queries";

export function FunnelChart({ data }: { data: FunnelStep[] }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">
        Воронка продажів
      </h3>
      <div className="space-y-3">
        {data.map((step, index) => (
          <div key={step.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-primary)]">{step.label}</span>
              <span className="text-[var(--color-text-secondary)]">
                {step.count.toLocaleString("uk-UA")} · {step.percent}%
              </span>
            </div>
            <div className="h-8 w-full overflow-hidden rounded-lg bg-[var(--color-bg-section)]">
              <div
                className="h-full rounded-lg transition-all duration-500"
                style={{
                  width: `${step.percent}%`,
                  backgroundColor: ["#1A4F8A", "#2B6CB0", "#C07B2A", "#276749"][index] ?? "#718096",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
