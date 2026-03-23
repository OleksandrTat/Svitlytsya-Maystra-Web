"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Calculator, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  evaluatePricingCondition,
  evaluatePricingExpression,
  getFormulaUserInputs,
  type PricingRuntimeInputs,
} from "@/lib/pricing/expression";
import type { FormulaComponent, PriceFormula, PricePreset } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  formula: PriceFormula | null;
  presets: PricePreset[];
  priceFrom: number | null;
  components?: FormulaComponent[];
  contactHref?: string;
};

function fallbackBlock(priceFrom: number | null, contactHref: string) {
  if (!priceFrom) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="text-xs text-[var(--color-text-secondary)]">Вартість</p>
      <p className="mt-1 font-display text-3xl text-[var(--color-primary)]">
        від {priceFrom.toLocaleString("uk-UA")} грн
      </p>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
        Точна вартість визначається після консультації та виміру.
      </p>
      <Link
        href={contactHref}
        className="mt-3 inline-block rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
      >
        Отримати розрахунок
      </Link>
    </div>
  );
}

function NumberField({
  label,
  unit,
  value,
  min = 0,
  step = 0.1,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</label>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, Number((value - step).toFixed(2))))}
          className="flex h-9 w-9 items-center justify-center rounded-l-xl border border-r-0 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-border)]"
        >
          <Minus size={12} />
        </button>
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
          className="h-9 w-full border border-[var(--color-border)] px-2 text-center text-sm font-semibold outline-none focus:ring-2 focus:ring-[var(--color-primary-300)]"
        />
        <button
          type="button"
          onClick={() => onChange(Number((value + step).toFixed(2)))}
          className="flex h-9 w-9 items-center justify-center rounded-r-xl border border-l-0 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] transition hover:bg-[var(--color-border)]"
        >
          <Plus size={12} />
        </button>
        <span className="ml-2 shrink-0 text-xs text-[var(--color-text-secondary)]">{unit}</span>
      </div>
    </div>
  );
}

function buildDefaultValues(formula: PriceFormula | null) {
  return getFormulaUserInputs(formula).reduce<PricingRuntimeInputs>((accumulator, input) => {
    accumulator[input.key] =
      input.type === "boolean" ? Boolean(input.default_value) : input.default_value ?? 0;
    return accumulator;
  }, {});
}

export function ProductPriceCalculator({
  formula,
  presets,
  priceFrom,
  components = [],
  contactHref = "/contact",
}: Props) {
  const inputSchema = useMemo(() => getFormulaUserInputs(formula), [formula]);
  const [values, setValues] = useState<PricingRuntimeInputs>(() => buildDefaultValues(formula));
  const debouncedValues = useDebounce(values, 250);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const presetById = useMemo(() => new Map(presets.map((preset) => [preset.id, preset])), [presets]);

  const result = useMemo(() => {
    if (!formula || components.length === 0) {
      return { total: null, breakdown: [] as { label: string; value: number; isDiscount: boolean }[] };
    }

    const sorted = [...components].sort((left, right) => left.sort_order - right.sort_order);
    const breakdown: { label: string; value: number; isDiscount: boolean }[] = [];
    let total = 0;

    for (const component of sorted) {
      const presetValue = component.preset_id ? (presetById.get(component.preset_id)?.value ?? null) : null;
      const visible = evaluatePricingCondition(component.condition, {
        presets,
        inputs: debouncedValues,
        presetValue,
      });

      if (!visible) {
        continue;
      }

      const value = evaluatePricingExpression(component.expression, {
        presets,
        inputs: debouncedValues,
        presetValue,
      });

      if (value === null) {
        continue;
      }

      breakdown.push({
        label: component.label,
        value: Math.round(value),
        isDiscount: component.is_discount,
      });
      total += component.is_discount ? -value : value;
    }

    return {
      total: Math.max(0, Math.round(total)),
      breakdown,
    };
  }, [components, debouncedValues, formula, presetById, presets]);

  if (!formula || components.length === 0) {
    return fallbackBlock(priceFrom, contactHref);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-100)]">
          <Calculator size={15} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Калькулятор вартості
          </p>
          <p className="text-[10px] text-[var(--color-text-secondary)]">
            Вкажіть параметри для live-розрахунку
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {inputSchema.length > 0 ? (
          <div className={cn("grid gap-3", inputSchema.length <= 1 ? "grid-cols-1" : "grid-cols-2")}>
            {inputSchema.map((input) =>
              input.type === "boolean" ? (
                <div key={input.key} className="col-span-full">
                  <button
                    type="button"
                    onClick={() =>
                      setValues((current) => ({ ...current, [input.key]: !(current[input.key] === true) }))
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                      values[input.key] === true
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-100)] text-[var(--color-primary)]"
                        : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]",
                    )}
                  >
                    <span className="text-sm font-medium">{input.label}</span>
                    <span className="text-xs font-semibold">
                      {values[input.key] === true ? "Так" : "Ні"}
                    </span>
                  </button>
                </div>
              ) : (
                <NumberField
                  key={input.key}
                  label={input.label}
                  unit={input.unit}
                  value={typeof values[input.key] === "number" ? (values[input.key] as number) : 0}
                  min={input.min ?? 0}
                  step={["м", "м2", "м3"].includes(input.unit) ? 0.1 : 1}
                  onChange={(nextValue) =>
                    setValues((current) => ({ ...current, [input.key]: nextValue }))
                  }
                />
              ),
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">
            Для цієї формули не налаштовано user-inputs.
          </p>
        )}

        {result.total !== null ? (
          <div className="rounded-xl border border-[var(--color-primary-300)] bg-[var(--color-primary-100)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">Орієнтовна вартість</p>
                <p className="mt-0.5 font-display text-3xl text-[var(--color-primary)]">
                  {result.total.toLocaleString("uk-UA")} грн
                </p>
              </div>
              {result.breakdown.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setShowBreakdown((current) => !current)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-primary-300)] bg-white/80 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)]"
                >
                  Деталі
                  {showBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              ) : null}
            </div>

            {showBreakdown && result.breakdown.length > 0 ? (
              <div className="mt-3 space-y-1 border-t border-[var(--color-primary-300)] pt-3">
                {result.breakdown.map((row, index) => (
                  <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-[var(--color-text-secondary)]">{row.label}</span>
                    <span
                      className={cn(
                        "font-semibold",
                        row.isDiscount ? "text-red-600" : "text-[var(--color-text-primary)]",
                      )}
                    >
                      {row.isDiscount ? "−" : "+"}
                      {row.value.toLocaleString("uk-UA")} грн
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <p className="mt-2 text-[10px] text-[var(--color-text-secondary)]">
              Орієнтовний розрахунок. Точна вартість після виміру та підтвердження.
            </p>
          </div>
        ) : priceFrom ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-xs text-[var(--color-text-secondary)]">Базова вартість</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--color-primary)]">
              від {priceFrom.toLocaleString("uk-UA")} грн
            </p>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Link
            href={contactHref}
            className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]"
          >
            Замовити
          </Link>
          <Link
            href={contactHref}
            className="flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-center text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)]"
          >
            Консультація
          </Link>
        </div>
      </div>
    </div>
  );
}
