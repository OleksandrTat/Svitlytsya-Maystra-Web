"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useTransition } from "react";
import { Check, Layers, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deletePricePresetAction, upsertPricePresetAction } from "@/actions/pricing";
import { normalizePricingVariableKey } from "@/lib/pricing/expression";
import type { PricePreset, PricePresetCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  presets: PricePreset[];
  onPresetsChange: (presets: PricePreset[]) => void;
};

type EditingField = "value" | "unit";

type EditingState = {
  id: string;
  field: EditingField;
  value: string;
};

const CATEGORY_META: Record<
  PricePresetCategory,
  { label: string; chipClassName: string; accentClassName: string }
> = {
  material: {
    label: "Матеріали",
    chipClassName: "border-sky-200 bg-sky-50 text-sky-700",
    accentClassName: "text-sky-700",
  },
  consumable: {
    label: "Витратники",
    chipClassName: "border-violet-200 bg-violet-50 text-violet-700",
    accentClassName: "text-violet-700",
  },
  labor: {
    label: "Праця",
    chipClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accentClassName: "text-emerald-700",
  },
  overhead: {
    label: "Накладні",
    chipClassName: "border-amber-200 bg-amber-50 text-amber-700",
    accentClassName: "text-amber-700",
  },
};

const CATEGORIES = Object.keys(CATEGORY_META) as PricePresetCategory[];

export function VariablesPopup({ open, onClose, presets, onPresetsChange }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PricePresetCategory | "all">("all");
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newPreset, setNewPreset] = useState({
    name: "",
    variable_key: "",
    category: "material" as PricePresetCategory,
    unit: "м2",
    value: "0",
    currency: "UAH",
    notes: "",
  });

  const filteredPresets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return presets.filter((preset) => {
      if (
        normalizedQuery &&
        !preset.name.toLowerCase().includes(normalizedQuery) &&
        !preset.variable_key.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }

      if (activeCategory !== "all" && preset.category !== activeCategory) {
        return false;
      }

      return true;
    });
  }, [activeCategory, presets, query]);

  const totalsByCategory = useMemo(
    () =>
      Object.fromEntries(
        CATEGORIES.map((category) => [
          category,
          presets.filter((preset) => preset.category === category).length,
        ]),
      ) as Record<PricePresetCategory, number>,
    [presets],
  );

  const saveEdit = (preset: PricePreset) => {
    if (!editing || editing.id !== preset.id) {
      return;
    }

    const formData = new FormData();
    formData.set("id", preset.id);
    formData.set("name", preset.name);
    formData.set("category", preset.category);
    formData.set("variable_key", preset.variable_key);
    formData.set("value", editing.field === "value" ? editing.value : String(preset.value));
    formData.set("unit", editing.field === "unit" ? editing.value : preset.unit);
    formData.set("currency", preset.currency);
    formData.set("notes", preset.notes ?? "");

    startTransition(async () => {
      const result = await upsertPricePresetAction(formData);
      if (!result.ok || !result.data) {
        toast.error(result.message);
        return;
      }

      onPresetsChange(
        presets.map((item) => (item.id === preset.id ? result.data ?? item : item)),
      );
      setEditing(null);
      toast.success("Змінну оновлено.");
    });
  };

  const createPreset = () => {
    const formData = new FormData();
    formData.set("name", newPreset.name.trim());
    formData.set("category", newPreset.category);
    formData.set("variable_key", newPreset.variable_key.trim());
    formData.set("unit", newPreset.unit.trim());
    formData.set("value", newPreset.value);
    formData.set("currency", newPreset.currency);
    formData.set("notes", newPreset.notes.trim());

    startTransition(async () => {
      const result = await upsertPricePresetAction(formData);
      if (!result.ok || !result.data) {
        toast.error(result.message);
        return;
      }

      onPresetsChange(
        [...presets, result.data].sort((left, right) => left.name.localeCompare(right.name, "uk-UA")),
      );
      setCreating(false);
      setNewPreset({
        name: "",
        variable_key: "",
        category: "material",
        unit: "м2",
        value: "0",
        currency: "UAH",
        notes: "",
      });
      toast.success("Змінну створено.");
    });
  };

  const deletePreset = (preset: PricePreset) => {
    const formData = new FormData();
    formData.set("id", preset.id);
    setDeletingId(preset.id);

    startTransition(async () => {
      const result = await deletePricePresetAction(formData);
      setDeletingId(null);

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      onPresetsChange(presets.filter((item) => item.id !== preset.id));
      toast.success("Змінну видалено.");
    });
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-100)]">
                  <Layers size={18} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Змінні ціноутворення
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {presets.length} змінних у бібліотеці
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCreating((current) => !current)}
                  className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]"
                >
                  <Plus size={14} />
                  Нова змінна
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 transition hover:bg-[var(--color-border)]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
              <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2">
                <Search size={14} className="text-[var(--color-text-secondary)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Пошук за назвою або variable_key..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
                />
              </div>

              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-medium transition",
                  activeCategory === "all"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-300)]",
                )}
              >
                Усі ({presets.length})
              </button>

              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition",
                    activeCategory === category
                      ? CATEGORY_META[category].chipClassName
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-300)]",
                  )}
                >
                  {CATEGORY_META[category].label} ({totalsByCategory[category]})
                </button>
              ))}
            </div>

            <AnimatePresence>
              {creating ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-primary-100)]"
                >
                  <div className="grid gap-3 px-6 py-4 md:grid-cols-4">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        Назва
                      </label>
                      <input
                        value={newPreset.name}
                        onChange={(event) => {
                          const name = event.target.value;
                          setNewPreset((current) => ({
                            ...current,
                            name,
                            variable_key: normalizePricingVariableKey(name, "variable"),
                          }));
                        }}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                        placeholder="Дуб (дошка)"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        Variable Key
                      </label>
                      <input
                        value={newPreset.variable_key}
                        onChange={(event) =>
                          setNewPreset((current) => ({
                            ...current,
                            variable_key: normalizePricingVariableKey(event.target.value, "variable"),
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 font-mono text-sm"
                        placeholder="oak_board"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        Категорія
                      </label>
                      <select
                        value={newPreset.category}
                        onChange={(event) =>
                          setNewPreset((current) => ({
                            ...current,
                            category: event.target.value as PricePresetCategory,
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {CATEGORY_META[category].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        Значення
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newPreset.value}
                        onChange={(event) =>
                          setNewPreset((current) => ({ ...current, value: event.target.value }))
                        }
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        Одиниця
                      </label>
                      <input
                        value={newPreset.unit}
                        onChange={(event) =>
                          setNewPreset((current) => ({ ...current, unit: event.target.value }))
                        }
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                        placeholder="м2"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        Валюта
                      </label>
                      <select
                        value={newPreset.currency}
                        onChange={(event) =>
                          setNewPreset((current) => ({
                            ...current,
                            currency: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                      >
                        <option value="UAH">UAH</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        Примітка
                      </label>
                      <input
                        value={newPreset.notes}
                        onChange={(event) =>
                          setNewPreset((current) => ({ ...current, notes: event.target.value }))
                        }
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                        placeholder="Необов'язковий коментар"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-6 pb-4">
                    <button
                      type="button"
                      onClick={createPreset}
                      disabled={!newPreset.name.trim() || !newPreset.variable_key.trim() || pending}
                      className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                    >
                      <Check size={14} />
                      {pending ? "Збереження..." : "Зберегти"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreating(false)}
                      className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm"
                    >
                      Скасувати
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto">
              {filteredPresets.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-16">
                  <Layers size={28} className="text-[var(--color-border)]" />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    За цими фільтрами змінних не знайдено
                  </p>
                </div>
              ) : (
                <table className="min-w-full">
                  <thead className="sticky top-0 z-10 bg-[var(--color-surface)]">
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        Назва / ключ
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        Категорія
                      </th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        Значення
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        Одиниця
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                        Примітка
                      </th>
                      <th className="w-14 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPresets.map((preset) => {
                      const categoryMeta = CATEGORY_META[preset.category];
                      const isEditing = editing?.id === preset.id;

                      return (
                        <tr
                          key={preset.id}
                          className="group border-b border-[var(--color-border)]/70 transition hover:bg-[var(--color-surface)]/50"
                        >
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              {preset.name}
                            </p>
                            <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                              {preset.variable_key}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                                categoryMeta.chipClassName,
                              )}
                            >
                              {categoryMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isEditing && editing?.field === "value" ? (
                              <input
                                autoFocus
                                type="number"
                                min="0"
                                step="0.01"
                                value={editing.value}
                                onChange={(event) =>
                                  setEditing({ ...editing, value: event.target.value })
                                }
                                onBlur={() => saveEdit(preset)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    saveEdit(preset);
                                  }
                                  if (event.key === "Escape") {
                                    setEditing(null);
                                  }
                                }}
                                className="w-28 rounded-xl border-2 border-[var(--color-primary)] px-2 py-1 text-right text-sm font-semibold outline-none"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditing({
                                    id: preset.id,
                                    field: "value",
                                    value: String(preset.value),
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-primary-100)]"
                              >
                                {preset.value.toLocaleString("uk-UA")}
                                <Pencil size={10} className={categoryMeta.accentClassName} />
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing && editing?.field === "unit" ? (
                              <input
                                autoFocus
                                value={editing.value}
                                onChange={(event) =>
                                  setEditing({ ...editing, value: event.target.value })
                                }
                                onBlur={() => saveEdit(preset)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    saveEdit(preset);
                                  }
                                  if (event.key === "Escape") {
                                    setEditing(null);
                                  }
                                }}
                                className="w-24 rounded-xl border-2 border-[var(--color-primary)] px-2 py-1 text-sm outline-none"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditing({
                                    id: preset.id,
                                    field: "unit",
                                    value: preset.unit,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-primary-100)]"
                              >
                                {preset.unit}
                                <Pencil size={10} />
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                            {preset.notes || "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => deletePreset(preset)}
                              disabled={pending || deletingId === preset.id}
                              className="rounded-lg p-1.5 text-[var(--color-text-secondary)] opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50"
                              title="Видалити"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Клацніть на значення або одиницю, щоб змінити їх інлайн
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium"
              >
                Закрити
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
