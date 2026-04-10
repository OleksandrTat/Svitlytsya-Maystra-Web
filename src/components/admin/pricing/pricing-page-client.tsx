"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  ChevronRight,
  Layers,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { VariablesPopup } from "@/components/admin/pricing/variables-popup";
import { getFormulaUserInputs } from "@/lib/pricing/expression";
import type { FormulaComponent, PriceFormula, PricePreset } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  formulas: PriceFormula[];
  presets: PricePreset[];
  formulaComponentsMap: Record<string, FormulaComponent[]>;
};

const TYPE_META: Record<string, { label: string; chip: string }> = {
  door:         { label: "Двері",       chip: "bg-sky-50 text-sky-700 border-sky-200" },
  furniture:    { label: "Меблі",       chip: "bg-amber-50 text-amber-700 border-amber-200" },
  window:       { label: "Вікна",       chip: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  restoration:  { label: "Реставрація", chip: "bg-rose-50 text-rose-700 border-rose-200" },
};

type FilterKey = "all" | keyof typeof TYPE_META;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Всі" },
  ...Object.entries(TYPE_META).map(([k, v]) => ({ key: k as FilterKey, label: v.label })),
];

export function PricingPageClient({ formulas, presets, formulaComponentsMap }: Props) {
  const router = useRouter();
  const [variablesOpen, setVariablesOpen] = useState(false);
  const [localPresets, setLocalPresets] = useState(presets);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const filtered = formulas.filter((f) => {
    if (filter !== "all" && f.product_type !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return f.name.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const countByType = Object.fromEntries(
    Object.keys(TYPE_META).map((t) => [t, formulas.filter((f) => f.product_type === t).length]),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Всього: {formulas.length} формул · {presets.length} пресетів
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVariablesOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <Layers size={15} />
            Пресети
          </button>
          <Link
            href="/admin/pricing/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)]"
          >
            <Plus size={16} />
            Нова формула
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <div
            key={type}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 cursor-pointer transition-colors hover:bg-zinc-50"
            onClick={() => setFilter(filter === type ? "all" : type as FilterKey)}
          >
            <div>
              <p className="text-2xl font-bold text-zinc-900">{countByType[type] ?? 0}</p>
              <p className="text-xs text-zinc-500">{meta.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук..."
            className="h-8 w-48 rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-zinc-400"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <Calculator size={40} className="mx-auto text-zinc-300" />
          <p className="mt-3 text-zinc-600">Формул не знайдено</p>
          <Link
            href="/admin/pricing/new"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]"
          >
            <Plus size={14} />
            Створити першу формулу
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((formula) => {
            const meta = TYPE_META[formula.product_type] ?? TYPE_META.door;
            const inputs = getFormulaUserInputs(formula);
            const componentCount = formulaComponentsMap[formula.id]?.length ?? 0;

            return (
              <div
                key={formula.id}
                className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50"
              >
                {/* Type badge */}
                <span className={cn("hidden shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold sm:inline", meta.chip)}>
                  {meta.label}
                </span>

                {/* Name + description */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{formula.name}</p>
                  {formula.description ? (
                    <p className="truncate text-xs text-zinc-500">{formula.description}</p>
                  ) : inputs.length > 0 ? (
                    <p className="truncate text-xs text-zinc-400 font-mono">
                      {inputs.map((i) => i.key).join(", ")}
                    </p>
                  ) : null}
                </div>

                {/* Component count */}
                <span className="hidden shrink-0 text-xs text-zinc-400 md:block">
                  {componentCount} компон.
                </span>

                {/* Status */}
                {!formula.is_active && (
                  <span className="hidden shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-500 sm:inline">
                    Неактивна
                  </span>
                )}

                {/* Actions */}
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Link
                    href={`/admin/pricing/${formula.id}/edit`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200"
                    title="Редагувати"
                  >
                    <Pencil size={14} />
                  </Link>
                  <Link
                    href={`/admin/pricing/${formula.id}`}
                    className="flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium text-zinc-500 hover:bg-zinc-200"
                    title="Компоненти"
                  >
                    Компоненти
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <VariablesPopup
        open={variablesOpen}
        onClose={() => { setVariablesOpen(false); router.refresh(); }}
        presets={localPresets}
        onPresetsChange={setLocalPresets}
      />
    </div>
  );
}
