"use client";

import type { CSSProperties } from "react";

type TopProduct = { name: string; count: number; revenue: number };

const COLORS = ["#1A4F8A", "#2B6CB0", "#C07B2A", "#276749", "#553C9A"];

export function TopProductsChart({ data }: { data: TopProduct[] }) {
  if (data.length === 0) {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <h3 className="mb-2 text-base font-semibold text-[var(--color-text-primary)]">
          Топ продукти
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">Недостатньо даних.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">
        Топ продукти за замовленнями
      </h3>
      <div className="space-y-2">
        {data.map((product, index) => (
          <div key={product.name} className="flex items-center gap-3">
            <div
              className="h-3 w-3 flex-shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] } as CSSProperties}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-[var(--color-text-primary)]">{product.name}</span>
                <span className="text-[var(--color-text-secondary)]">{product.count} замовлень</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--color-bg-section)]">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${Math.round((product.count / data[0].count) * 100)}%`,
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
