"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Calculator, ChevronDown, ChevronUp, GripVertical, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { upsertPriceFormulaAction } from "@/actions/pricing";
import {
  evaluatePricingCondition,
  evaluatePricingExpression,
  getFormulaUserInputs,
  normalizePricingVariableKey,
  type PricingInputDefinition,
  type PricingRuntimeInputs,
} from "@/lib/pricing/expression";
import type { FormulaComponent, FormulaComponentType, PriceFormula, PricePreset } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExpressionEditor, type VariableToken } from "./expression-editor";

type Props = {
  open: boolean;
  onClose: () => void;
  presets: PricePreset[];
  initialData?: Partial<PriceFormula>;
  initialComponents?: FormulaComponent[];
  onSaved: () => void;
};

type EditableComponent = {
  id: string;
  type: FormulaComponentType;
  label: string;
  preset_id: string | null;
  expression: string;
  condition: string;
  notes: string;
  is_discount: boolean;
  sort_order: number;
};

const PRODUCT_TYPES = [
  { value: "door", label: "Двері" },
  { value: "furniture", label: "Меблі" },
  { value: "window", label: "Вікна" },
  { value: "restoration", label: "Реставрація" },
] as const;

const COMPONENT_TYPES: { value: FormulaComponentType; label: string; className: string }[] = [
  { value: "material", label: "Матеріал", className: "border-sky-200 bg-sky-50 text-sky-700" },
  { value: "labor", label: "Праця", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  { value: "consumable", label: "Витратник", className: "border-violet-200 bg-violet-50 text-violet-700" },
  { value: "overhead", label: "Накладні", className: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "tax", label: "Податок", className: "border-rose-200 bg-rose-50 text-rose-700" },
  { value: "margin", label: "Маржа", className: "border-orange-200 bg-orange-50 text-orange-700" },
];

const COMMON_INPUTS: PricingInputDefinition[] = [
  { key: "width_m", label: "Ширина", unit: "м", type: "number", default_value: 0.9, min: 0 },
  { key: "height_m", label: "Висота", unit: "м", type: "number", default_value: 2.1, min: 0 },
  { key: "depth_m", label: "Глибина", unit: "м", type: "number", default_value: 0.05, min: 0 },
  { key: "quantity", label: "Кількість", unit: "шт", type: "number", default_value: 1, min: 1 },
  { key: "area_m2", label: "Площа", unit: "м2", type: "number", default_value: 1, min: 0 },
  { key: "perimeter_m", label: "Периметр", unit: "м", type: "number", default_value: 6, min: 0 },
  { key: "floors", label: "Поверхів", unit: "пов.", type: "number", default_value: 1, min: 1 },
  { key: "has_glass", label: "Є скло", unit: "bool", type: "boolean", default_value: 0 },
];

function tempId() {
  return `tmp-${Math.random().toString(36).slice(2, 10)}`;
}

function toEditable(components: FormulaComponent[] = []): EditableComponent[] {
  return components.map((component) => ({
    id: component.id,
    type: component.type,
    label: component.label,
    preset_id: component.preset_id,
    expression: component.expression,
    condition: component.condition ?? "",
    notes: component.notes ?? "",
    is_discount: component.is_discount,
    sort_order: component.sort_order,
  }));
}

function defaultValues(inputs: PricingInputDefinition[]) {
  return inputs.reduce<PricingRuntimeInputs>((acc, input) => {
    acc[input.key] = input.type === "boolean" ? Boolean(input.default_value) : input.default_value ?? 0;
    return acc;
  }, {});
}

function componentValue(
  component: EditableComponent,
  presets: PricePreset[],
  testValues: PricingRuntimeInputs,
  presetById: Map<string, PricePreset>,
) {
  const presetValue = component.preset_id ? (presetById.get(component.preset_id)?.value ?? null) : null;
  const visible = evaluatePricingCondition(component.condition, { presets, inputs: testValues, presetValue });
  if (!visible) {
    return null;
  }
  return evaluatePricingExpression(component.expression, { presets, inputs: testValues, presetValue });
}

export function FormulaBuilderPopup({
  open,
  onClose,
  presets,
  initialData,
  initialComponents = [],
  onSaved,
}: Props) {
  const initialInputs = getFormulaUserInputs({
    user_inputs: initialData?.user_inputs ?? [],
    input_schema: initialData?.input_schema ?? [],
  });

  const [name, setName] = useState(initialData?.name ?? "");
  const [productType, setProductType] = useState(initialData?.product_type ?? "door");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [userInputs, setUserInputs] = useState<PricingInputDefinition[]>(initialInputs);
  const [components, setComponents] = useState<EditableComponent[]>(toEditable(initialComponents));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(initialComponents.map((item) => item.id)));
  const [testValues, setTestValues] = useState<PricingRuntimeInputs>(defaultValues(initialInputs));
  const [saving, setSaving] = useState(false);
  const [customInputOpen, setCustomInputOpen] = useState(false);
  const [customInput, setCustomInput] = useState<PricingInputDefinition>({
    key: "",
    label: "",
    unit: "шт",
    type: "number",
    default_value: 0,
  });

  const presetById = useMemo(() => new Map(presets.map((preset) => [preset.id, preset])), [presets]);
  const presetTokens = useMemo<VariableToken[]>(
    () => presets.map((preset) => ({ kind: "preset", key: preset.variable_key, label: preset.name, value: preset.value, unit: preset.unit })),
    [presets],
  );
  const inputTokens = useMemo<VariableToken[]>(
    () => userInputs.map((input) => ({ kind: "input", key: input.key, label: input.label, unit: input.unit, inputType: input.type })),
    [userInputs],
  );

  const totalPreview = useMemo(
    () =>
      [...components]
        .sort((a, b) => a.sort_order - b.sort_order)
        .reduce((sum, component) => {
          const value = componentValue(component, presets, testValues, presetById);
          if (value === null) {
            return sum;
          }
          return sum + (component.is_discount ? -value : value);
        }, 0),
    [components, presetById, presets, testValues],
  );

  const updateComponent = (id: string, patch: Partial<EditableComponent>) => {
    setComponents((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addComponent = () => {
    const id = tempId();
    setComponents((current) => [
      ...current,
      {
        id,
        type: "material",
        label: "Новий компонент",
        preset_id: null,
        expression: "",
        condition: "",
        notes: "",
        is_discount: false,
        sort_order: current.length,
      },
    ]);
    setExpandedIds((current) => new Set(current).add(id));
  };

  const removeComponent = (id: string) => {
    setComponents((current) =>
      current.filter((item) => item.id !== id).map((item, index) => ({ ...item, sort_order: index })),
    );
    setExpandedIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const toggleInput = (input: PricingInputDefinition) => {
    setUserInputs((current) => {
      const exists = current.some((item) => item.key === input.key);
      return exists ? current.filter((item) => item.key !== input.key) : [...current, input];
    });
    setTestValues((current) => ({
      ...current,
      [input.key]: input.type === "boolean" ? Boolean(input.default_value) : input.default_value ?? 0,
    }));
  };

  const addCustomInput = () => {
    const key = normalizePricingVariableKey(customInput.key || customInput.label, "input");
    const label = customInput.label.trim();
    if (!key || !label) {
      return;
    }
    const next = { ...customInput, key, label };
    setUserInputs((current) => [...current, next]);
    setTestValues((current) => ({
      ...current,
      [next.key]: next.type === "boolean" ? Boolean(next.default_value) : next.default_value ?? 0,
    }));
    setCustomInput({ key: "", label: "", unit: "шт", type: "number", default_value: 0 });
    setCustomInputOpen(false);
  };

  const saveFormula = async () => {
    if (!name.trim()) {
      toast.error("Вкажіть назву формули.");
      return;
    }

    setSaving(true);
    const formData = new FormData();
    if (initialData?.id) {
      formData.set("id", initialData.id);
    }
    formData.set("name", name.trim());
    formData.set("product_type", productType);
    formData.set("description", description.trim());
    formData.set("is_active", isActive ? "true" : "false");
    formData.set("user_inputs", JSON.stringify(userInputs));
    formData.set("input_schema", JSON.stringify(userInputs));
    formData.set(
      "components",
      JSON.stringify(
        components.map((component, index) => ({
          ...component,
          sort_order: index,
          condition: component.condition.trim(),
          notes: component.notes.trim(),
        })),
      ),
    );

    const result = await upsertPriceFormulaAction(formData);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    onSaved();
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 pt-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-6xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4" style={{ background: "linear-gradient(135deg, #120404 0%, #1c0606 55%, #2b0909 100%)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Calculator size={20} className="text-white" /></div>
                <div>
                  <h2 className="text-base font-semibold text-white">{initialData?.id ? "Редагувати формулу" : "Нова формула"}</h2>
                  <p className="text-xs text-white/60">Ліва колонка керує метаданими та inputs, права збирає витрати по компонентах</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"><X size={18} /></button>
            </div>

            <div className="grid lg:grid-cols-[320px_1fr]" style={{ maxHeight: "82vh" }}>
              <div className="flex flex-col overflow-y-auto border-r border-[var(--color-border)] bg-[#100707]">
                <div className="space-y-3 border-b border-white/10 p-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">Назва</label>
                    <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30" placeholder="Двері з дуба" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">Тип продукту</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRODUCT_TYPES.map((type) => (
                        <button key={type.value} type="button" onClick={() => setProductType(type.value)} className={cn("rounded-xl border px-2 py-2 text-xs font-medium transition", productType === type.value ? "border-[#b5860d] bg-[#b5860d]/20 text-[#d6a62e]" : "border-white/15 text-white/60 hover:border-white/25 hover:text-white")}>
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">Опис</label>
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30" placeholder="Коротко про формулу" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-white/70"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />Формула активна</label>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">Введення користувача</p>
                    <p className="mt-1 text-[11px] text-white/35">Що клієнт заповнює у калькуляторі</p>
                  </div>
                  <div className="space-y-1.5">
                    {COMMON_INPUTS.map((input) => {
                      const active = userInputs.some((item) => item.key === input.key);
                      return (
                        <button key={input.key} type="button" onClick={() => toggleInput(input)} className={cn("flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition", active ? "border-violet-500/50 bg-violet-500/15 text-violet-300" : "border-white/10 text-white/60 hover:border-white/25 hover:text-white")}>
                          <span className="font-mono">{input.key}</span>
                          <span className="text-[10px] opacity-70">{input.label} · {input.unit}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setCustomInputOpen((current) => !current)} className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/20 px-3 py-2 text-xs text-white/50 transition hover:border-white/35 hover:text-white/70"><Plus size={12} />Своя змінна введення</button>
                  {customInputOpen ? (
                    <div className="space-y-2 rounded-xl border border-white/15 bg-white/5 p-3">
                      <input value={customInput.label} onChange={(event) => setCustomInput((current) => ({ ...current, label: event.target.value, key: normalizePricingVariableKey(event.target.value, "input") }))} className="w-full rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-xs text-white outline-none placeholder:text-white/30" placeholder="Назва для клієнта" />
                      <input value={customInput.key} onChange={(event) => setCustomInput((current) => ({ ...current, key: normalizePricingVariableKey(event.target.value, "input") }))} className="w-full rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 font-mono text-xs text-white outline-none placeholder:text-white/30" placeholder="my_input" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={customInput.unit} onChange={(event) => setCustomInput((current) => ({ ...current, unit: event.target.value }))} className="rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-xs text-white outline-none placeholder:text-white/30" placeholder="шт" />
                        <select value={customInput.type} onChange={(event) => setCustomInput((current) => ({ ...current, type: event.target.value as "number" | "boolean" }))} className="rounded-lg border border-white/15 bg-[#1a0a0a] px-2 py-1.5 text-xs text-white outline-none">
                          <option value="number">Число</option>
                          <option value="boolean">Так / Ні</option>
                        </select>
                      </div>
                      <button type="button" onClick={addCustomInput} disabled={!customInput.key.trim() || !customInput.label.trim()} className="w-full rounded-lg bg-violet-600 py-2 text-xs font-semibold text-white transition disabled:opacity-50">Додати input</button>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-white/10 p-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Live підсумок</p>
                  <p className="mt-1 text-2xl font-bold text-[#d6a62e]">{Math.max(0, Math.round(totalPreview)).toLocaleString("uk-UA")} грн</p>
                </div>
              </div>

              <div className="flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Компоненти формули</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Кожен рядок описує окрему статтю витрат або знижку</p>
                  </div>
                  <button type="button" onClick={addComponent} className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]"><Plus size={14} />Додати компонент</button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {components.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] py-16 text-center">
                      <Calculator size={28} className="text-[var(--color-border)]" />
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">Поки що немає компонентів</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Додайте перший рядок витрат, щоб формула почала рахувати</p>
                    </div>
                  ) : null}

                  {components.map((component, index) => {
                    const expanded = expandedIds.has(component.id);
                    const value = componentValue(component, presets, testValues, presetById);
                    const typeMeta = COMPONENT_TYPES.find((item) => item.value === component.type);

                    return (
                      <motion.div key={component.id} layout className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
                        <div
                          className="flex cursor-pointer items-center gap-2 px-4 py-3 transition hover:bg-[var(--color-surface)]"
                          onClick={() =>
                            setExpandedIds((current) => {
                              const next = new Set(current);
                              if (next.has(component.id)) {
                                next.delete(component.id);
                              } else {
                                next.add(component.id);
                              }
                              return next;
                            })
                          }
                        >
                          <GripVertical size={14} className="text-[var(--color-border)]" />
                          <span className="w-5 text-xs font-mono text-[var(--color-text-secondary)]">{index + 1}</span>
                          <input value={component.label} onChange={(event) => updateComponent(component.id, { label: event.target.value })} onClick={(event) => event.stopPropagation()} className="flex-1 bg-transparent text-sm font-semibold text-[var(--color-text-primary)] outline-none" />
                          <select value={component.type} onChange={(event) => updateComponent(component.id, { type: event.target.value as FormulaComponentType })} onClick={(event) => event.stopPropagation()} className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold outline-none", typeMeta?.className)}>
                            {COMPONENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                          </select>
                          {value !== null ? <span className={cn("text-xs font-semibold", component.is_discount ? "text-red-600" : "text-emerald-600")}>{component.is_discount ? "−" : "+"}{Math.round(value).toLocaleString("uk-UA")} грн</span> : null}
                          <label className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]" onClick={(event) => event.stopPropagation()}><input type="checkbox" checked={component.is_discount} onChange={(event) => updateComponent(component.id, { is_discount: event.target.checked })} />знижка</label>
                          <button type="button" onClick={(event) => { event.stopPropagation(); removeComponent(component.id); }} className="rounded-full p-1 text-[var(--color-text-secondary)] transition hover:bg-red-50 hover:text-red-600"><Trash2 size={13} /></button>
                          {expanded ? <ChevronUp size={14} className="text-[var(--color-text-secondary)]" /> : <ChevronDown size={14} className="text-[var(--color-text-secondary)]" />}
                        </div>

                        <AnimatePresence>
                          {expanded ? (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                              <div className="space-y-3 border-t border-[var(--color-border)] p-4">
                                <ExpressionEditor
                                  value={component.expression}
                                  onChange={(nextValue) => updateComponent(component.id, { expression: nextValue })}
                                  presetVars={presetTokens}
                                  inputVars={inputTokens}
                                  testValues={testValues}
                                  onTestValueChange={(key, nextValue) => setTestValues((current) => ({ ...current, [key]: nextValue }))}
                                  placeholder="oak_board * width_m * height_m"
                                />
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Умова</label>
                                  <input value={component.condition} onChange={(event) => updateComponent(component.id, { condition: event.target.value })} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 font-mono text-xs outline-none transition focus:border-[var(--color-primary)]" placeholder="has_glass === true" />
                                  <p className="text-[10px] text-[var(--color-text-secondary)]">Якщо умова хибна, рядок ігнорується</p>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Примітка</label>
                                  <input value={component.notes} onChange={(event) => updateComponent(component.id, { notes: event.target.value })} className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm outline-none transition focus:border-[var(--color-primary)]" placeholder="Необов'язково" />
                                </div>
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
                  <div className="text-sm text-[var(--color-text-secondary)]">Підсумок тесту: <span className="font-bold text-[var(--color-primary)]">{Math.max(0, Math.round(totalPreview)).toLocaleString("uk-UA")} грн</span></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={onClose} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm">Скасувати</button>
                    <button type="button" onClick={() => void saveFormula()} disabled={saving || !name.trim()} className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-60"><Calculator size={14} />{saving ? "Збереження..." : "Зберегти формулу"}</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
