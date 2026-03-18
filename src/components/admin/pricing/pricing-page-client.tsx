"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calculator, ChevronRight, Layers, Pencil, Plus } from "lucide-react";
import { FormulaBuilderPopup } from "@/components/admin/pricing/formula-builder-popup";
import { VariablesPopup } from "@/components/admin/pricing/variables-popup";
import { getFormulaUserInputs } from "@/lib/pricing/expression";
import type { FormulaComponent, PriceFormula, PricePreset } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  formulas: PriceFormula[];
  presets: PricePreset[];
  formulaComponentsMap: Record<string, FormulaComponent[]>;
};

const PRODUCT_TYPE_META: Record<
  string,
  { label: string; gradient: string; badgeClassName: string }
> = {
  door: {
    label: "Двері",
    gradient: "from-sky-500 to-sky-700",
    badgeClassName: "bg-sky-50 text-sky-700",
  },
  furniture: {
    label: "Меблі",
    gradient: "from-amber-500 to-amber-700",
    badgeClassName: "bg-amber-50 text-amber-700",
  },
  window: {
    label: "Вікна",
    gradient: "from-emerald-500 to-emerald-700",
    badgeClassName: "bg-emerald-50 text-emerald-700",
  },
  restoration: {
    label: "Реставрація",
    gradient: "from-rose-500 to-rose-700",
    badgeClassName: "bg-rose-50 text-rose-700",
  },
};

function FormulaCard({
  formula,
  componentCount,
  onEdit,
}: {
  formula: PriceFormula;
  componentCount: number;
  onEdit: (formula: PriceFormula) => void;
}) {
  const meta = PRODUCT_TYPE_META[formula.product_type] ?? PRODUCT_TYPE_META.door;
  const inputs = getFormulaUserInputs(formula);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={cn("h-1 w-full bg-gradient-to-r", meta.gradient)} />

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", meta.badgeClassName)}>
                {meta.label}
              </span>
              {formula.is_active ? null : (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                  Неактивна
                </span>
              )}
            </div>

            <h3 className="mt-2 text-lg font-semibold leading-tight text-[var(--color-text-primary)]">
              {formula.name}
            </h3>

            {formula.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                {formula.description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onEdit(formula)}
            className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <Pencil size={13} />
          </button>
        </div>

        {inputs.length > 0 ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Input-змінні
            </p>
            <div className="flex flex-wrap gap-1.5">
              {inputs.map((input) => (
                <span
                  key={input.key}
                  className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 font-mono text-[10px] text-violet-700"
                >
                  {input.key}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
          <div className="text-xs text-[var(--color-text-secondary)]">
            {componentCount} компонентів
          </div>
          <Link
            href={`/admin/pricing/${formula.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
          >
            Компоненти
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export function PricingPageClient({
  formulas,
  presets,
  formulaComponentsMap,
}: Props) {
  const router = useRouter();
  const [variablesOpen, setVariablesOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<PriceFormula | null>(null);
  const [localPresets, setLocalPresets] = useState(presets);

  const totalsByType = Object.fromEntries(
    Object.keys(PRODUCT_TYPE_META).map((type) => [
      type,
      formulas.filter((formula) => formula.product_type === type).length,
    ]),
  );

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        <div
          className="px-6 py-5"
          style={{ background: "linear-gradient(135deg, #100303 0%, #1c0606 55%, #2a0909 100%)" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-xl text-white">Система ціноутворення</h2>
              <p className="mt-1 text-sm text-white/60">
                {formulas.length} формул · {localPresets.length} змінних у бібліотеці
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setVariablesOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <Layers size={16} />
                Змінні
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingFormula(null);
                  setBuilderOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#b5860d] px-4 py-2.5 text-sm font-semibold text-[#140606] transition hover:bg-[#c9991c]"
              >
                <Plus size={16} />
                Нова формула
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-[var(--color-border)] border-t border-[var(--color-border)] md:grid-cols-4 md:divide-y-0">
          {Object.entries(PRODUCT_TYPE_META).map(([type, meta]) => (
            <div key={type} className="px-4 py-3 text-center">
              <p className="text-xs text-[var(--color-text-secondary)]">{meta.label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                {totalsByType[type] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {formulas.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--color-border)] py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface)]">
            <Calculator size={24} className="text-[var(--color-border)]" />
          </div>
          <div>
            <p className="font-semibold text-[var(--color-text-primary)]">Формул ще немає</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Створіть першу формулу, щоб запустити новий калькулятор на продуктах
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {formulas.map((formula) => (
            <FormulaCard
              key={formula.id}
              formula={formula}
              componentCount={formulaComponentsMap[formula.id]?.length ?? 0}
              onEdit={(nextFormula) => {
                setEditingFormula(nextFormula);
                setBuilderOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <VariablesPopup
        open={variablesOpen}
        onClose={() => {
          setVariablesOpen(false);
          router.refresh();
        }}
        presets={localPresets}
        onPresetsChange={setLocalPresets}
      />

      {builderOpen ? (
        <FormulaBuilderPopup
          key={editingFormula?.id ?? "new-formula"}
          open={builderOpen}
          onClose={() => {
            setBuilderOpen(false);
            setEditingFormula(null);
          }}
          presets={localPresets}
          initialData={editingFormula ?? undefined}
          initialComponents={
            editingFormula ? formulaComponentsMap[editingFormula.id] ?? [] : []
          }
          onSaved={() => {
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
