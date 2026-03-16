"use client";

import { useState } from "react";
import type { PriceFormula, PricePreset } from "@/lib/types";

type Props = {
  formula: PriceFormula | null;
  presets: PricePreset[];
  priceFrom: number | null;
};

export function ProductPriceCalculator({ formula, presets, priceFrom }: Props) {
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [result, setResult] = useState<number | null>(null);

  if (!formula) {
    if (!priceFrom) {
      return null;
    }

    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="text-sm text-[var(--color-text-secondary)]">Ціна від</p>
        <p className="mt-1 font-display text-3xl text-[var(--color-primary)]">
          {priceFrom.toLocaleString("uk-UA")} грн
        </p>
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
          Точна вартість визначається після консультації.
        </p>
      </div>
    );
  }

  const inputSchema = Array.isArray(formula.input_schema)
    ? (formula.input_schema as { key: string; label?: string; unit?: string; type: string }[])
    : [];

  const calculate = () => {
    const multiplier = Object.values(inputs).reduce((acc, value) => acc * value, 1);
    let total = 0;

    for (const preset of presets) {
      total += preset.value * multiplier * 0.001;
    }

    setResult(Math.max(priceFrom ?? 0, Math.round(total)));
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Розрахунок вартості</h3>
      {priceFrom && (
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          Ціна від {priceFrom.toLocaleString("uk-UA")} грн
        </p>
      )}

      <div className="mt-4 grid gap-3">
        {inputSchema.map((field) => (
          <label key={field.key} className="space-y-1 text-sm">
            <span className="text-[var(--color-text-secondary)]">
              {field.label ?? field.key}
              {field.unit ? ` (${field.unit})` : ""}
            </span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={inputs[field.key] ?? ""}
              onChange={(event) =>
                setInputs((prev) => ({
                  ...prev,
                  [field.key]: Number(event.target.value),
                }))
              }
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={calculate}
        className="mt-4 w-full rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white"
      >
        Розрахувати
      </button>

      {result !== null && (
        <div className="mt-4 rounded-xl bg-white p-3 text-center">
          <p className="text-xs text-[var(--color-text-secondary)]">Орієнтовна вартість</p>
          <p className="mt-1 font-display text-3xl text-[var(--color-primary)]">
            ~{result.toLocaleString("uk-UA")} грн
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Точна сума після виміру та консультації.
          </p>
        </div>
      )}
    </div>
  );
}
