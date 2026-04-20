"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Calculator,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
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
  initialData?: Partial<PriceFormula>;
  initialComponents?: FormulaComponent[];
  presets: PricePreset[];
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
  return components.map((c) => ({
    id: c.id,
    type: c.type,
    label: c.label,
    preset_id: c.preset_id,
    expression: c.expression,
    condition: c.condition ?? "",
    notes: c.notes ?? "",
    is_discount: c.is_discount,
    sort_order: c.sort_order,
  }));
}

function defaultValues(inputs: PricingInputDefinition[]): PricingRuntimeInputs {
  return inputs.reduce<PricingRuntimeInputs>((acc, i) => {
    acc[i.key] = i.type === "boolean" ? Boolean(i.default_value) : i.default_value ?? 0;
    return acc;
  }, {});
}

export function FormulaForm({ initialData, initialComponents = [], presets }: Props) {
  const router = useRouter();
  const isEdit = Boolean(initialData?.id);

  const initialInputs = getFormulaUserInputs({
    user_inputs: initialData?.user_inputs ?? [],
  });

  const [name, setName] = useState(initialData?.name ?? "");
  const [productType, setProductType] = useState(initialData?.product_type ?? "door");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [userInputs, setUserInputs] = useState<PricingInputDefinition[]>(initialInputs);
  const [components, setComponents] = useState<EditableComponent[]>(toEditable(initialComponents));
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(initialComponents.map((c) => c.id)));
  const [testValues, setTestValues] = useState<PricingRuntimeInputs>(defaultValues(initialInputs));
  const [saving, setSaving] = useState(false);
  const [customInputOpen, setCustomInputOpen] = useState(false);
  const [customInput, setCustomInput] = useState<PricingInputDefinition>({
    key: "", label: "", unit: "шт", type: "number", default_value: 0,
  });

  const presetById = useMemo(() => new Map(presets.map((p) => [p.id, p])), [presets]);
  const presetTokens = useMemo<VariableToken[]>(
    () => presets.map((p) => ({ kind: "preset", key: p.variable_key, label: p.name, value: p.value, unit: p.unit })),
    [presets],
  );
  const inputTokens = useMemo<VariableToken[]>(
    () => userInputs.map((i) => ({ kind: "input", key: i.key, label: i.label, unit: i.unit, inputType: i.type })),
    [userInputs],
  );

  const totalPreview = useMemo(() =>
    [...components].sort((a, b) => a.sort_order - b.sort_order).reduce((sum, c) => {
      const presetValue = c.preset_id ? (presetById.get(c.preset_id)?.value ?? null) : null;
      const visible = evaluatePricingCondition(c.condition, { presets, inputs: testValues, presetValue });
      if (!visible) return sum;
      const val = evaluatePricingExpression(c.expression, { presets, inputs: testValues, presetValue }) ?? 0;
      return sum + (c.is_discount ? -val : val);
    }, 0),
    [components, presetById, presets, testValues],
  );

  const updateComponent = (id: string, patch: Partial<EditableComponent>) =>
    setComponents((curr) => curr.map((c) => c.id === id ? { ...c, ...patch } : c));

  const addComponent = () => {
    const id = tempId();
    setComponents((curr) => [
      ...curr,
      { id, type: "material", label: "Новий компонент", preset_id: null, expression: "", condition: "", notes: "", is_discount: false, sort_order: curr.length },
    ]);
    setExpandedIds((curr) => new Set(curr).add(id));
  };

  const removeComponent = (id: string) => {
    setComponents((curr) => curr.filter((c) => c.id !== id).map((c, i) => ({ ...c, sort_order: i })));
    setExpandedIds((curr) => { const n = new Set(curr); n.delete(id); return n; });
  };

  const toggleInput = (input: PricingInputDefinition) => {
    setUserInputs((curr) => {
      const exists = curr.some((i) => i.key === input.key);
      return exists ? curr.filter((i) => i.key !== input.key) : [...curr, input];
    });
    setTestValues((curr) => ({
      ...curr,
      [input.key]: input.type === "boolean" ? Boolean(input.default_value) : input.default_value ?? 0,
    }));
  };

  const addCustomInput = () => {
    const key = normalizePricingVariableKey(customInput.key || customInput.label, "input");
    const label = customInput.label.trim();
    if (!key || !label) return;
    const next = { ...customInput, key, label };
    setUserInputs((curr) => [...curr, next]);
    setTestValues((curr) => ({ ...curr, [next.key]: next.type === "boolean" ? Boolean(next.default_value) : next.default_value ?? 0 }));
    setCustomInput({ key: "", label: "", unit: "шт", type: "number", default_value: 0 });
    setCustomInputOpen(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Вкажіть назву формули."); return; }
    setSaving(true);
    const fd = new FormData();
    if (initialData?.id) fd.set("id", initialData.id);
    fd.set("name", name.trim());
    fd.set("product_type", productType);
    fd.set("description", description.trim());
    fd.set("is_active", isActive ? "true" : "false");
    fd.set("user_inputs", JSON.stringify(userInputs));
    fd.set("components", JSON.stringify(
      components.map((c, i) => ({ ...c, sort_order: i, condition: c.condition.trim(), notes: c.notes.trim() })),
    ));
    const result = await upsertPriceFormulaAction(fd);
    setSaving(false);
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(result.message);
    router.push("/admin/pricing");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f5]">

      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-5 py-3">
          <button type="button" onClick={() => router.push("/admin/pricing")}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900">
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Ціноутворення</span>
          </button>
          <div className="h-4 w-px bg-zinc-200" />

          <div className="flex items-center gap-2">
            <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500")}>
              <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-400" : "bg-zinc-300")} />
              {isActive ? "Активна" : "Неактивна"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => void handleSave()} disabled={saving || !name.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-primary-700)] disabled:opacity-40">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {isEdit ? "Зберегти" : "Створити"}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-6">
        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">

          {/* Left sidebar */}
          <div className="space-y-4">

            {/* Meta */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-[#100707] shadow-sm">
              <div className="space-y-3 p-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Назва</label>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
                    placeholder="Двері з дуба" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Тип продукту</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRODUCT_TYPES.map((t) => (
                      <button key={t.value} type="button" onClick={() => setProductType(t.value)}
                        className={cn("rounded-xl border px-2 py-2 text-xs font-medium transition",
                          productType === t.value
                            ? "border-[#b5860d] bg-[#b5860d]/20 text-[#d6a62e]"
                            : "border-white/15 text-white/60 hover:border-white/25 hover:text-white")}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Опис</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                    className="w-full resize-none rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
                    placeholder="Коротко про формулу" />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Формула активна
                </label>
              </div>
              <div className="border-t border-white/10 px-5 py-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Live підсумок</p>
                <p className="mt-1 text-2xl font-bold text-[#d6a62e]">
                  {Math.max(0, Math.round(totalPreview)).toLocaleString("uk-UA")} грн
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">Введення користувача</p>
                <p className="text-xs text-zinc-400">Що клієнт заповнює у калькуляторі</p>
              </div>
              <div className="space-y-1.5 p-3">
                {COMMON_INPUTS.map((input) => {
                  const active = userInputs.some((i) => i.key === input.key);
                  return (
                    <button key={input.key} type="button" onClick={() => toggleInput(input)}
                      className={cn("flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition",
                        active
                          ? "border-violet-200 bg-violet-50 text-violet-700"
                          : "border-zinc-100 text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-800")}>
                      <span className="font-mono">{input.key}</span>
                      <span className="text-[10px] opacity-70">{input.label} · {input.unit}</span>
                    </button>
                  );
                })}
                <button type="button" onClick={() => setCustomInputOpen((v) => !v)}
                  className="flex w-full items-center gap-2 rounded-xl border border-dashed border-zinc-200 px-3 py-2 text-xs text-zinc-400 transition hover:border-zinc-300 hover:text-zinc-600">
                  <Plus size={12} /> Своя змінна введення
                </button>
                {customInputOpen && (
                  <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                    <input value={customInput.label}
                      onChange={(e) => setCustomInput((c) => ({ ...c, label: e.target.value, key: normalizePricingVariableKey(e.target.value, "input") }))}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none placeholder:text-zinc-300"
                      placeholder="Назва для клієнта" />
                    <input value={customInput.key}
                      onChange={(e) => setCustomInput((c) => ({ ...c, key: normalizePricingVariableKey(e.target.value, "input") }))}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 font-mono text-xs outline-none placeholder:text-zinc-300"
                      placeholder="my_input" />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={customInput.unit} onChange={(e) => setCustomInput((c) => ({ ...c, unit: e.target.value }))}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none" placeholder="шт" />
                      <select value={customInput.type} onChange={(e) => setCustomInput((c) => ({ ...c, type: e.target.value as "number" | "boolean" }))}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none">
                        <option value="number">Число</option>
                        <option value="boolean">Так / Ні</option>
                      </select>
                    </div>
                    <button type="button" onClick={addCustomInput} disabled={!customInput.key.trim() || !customInput.label.trim()}
                      className="w-full rounded-lg bg-violet-600 py-2 text-xs font-semibold text-white transition disabled:opacity-50">
                      Додати input
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — components */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Компоненти формули</p>
                  <p className="text-xs text-zinc-400">Кожен рядок описує окрему статтю витрат або знижку</p>
                </div>
                <button type="button" onClick={addComponent}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-700)]">
                  <Plus size={14} /> Додати компонент
                </button>
              </div>

              <div className="space-y-3 p-4">
                {components.length === 0 && (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-200 py-16 text-center">
                    <Calculator size={28} className="text-zinc-300" />
                    <p className="text-sm font-medium text-zinc-500">Поки що немає компонентів</p>
                    <p className="text-xs text-zinc-400">Додайте перший рядок витрат, щоб формула почала рахувати</p>
                  </div>
                )}

                {components.map((component, index) => {
                  const expanded = expandedIds.has(component.id);
                  const presetValue = component.preset_id ? (presetById.get(component.preset_id)?.value ?? null) : null;
                  const visible = evaluatePricingCondition(component.condition, { presets, inputs: testValues, presetValue });
                  const val = visible ? evaluatePricingExpression(component.expression, { presets, inputs: testValues, presetValue }) : null;
                  const typeMeta = COMPONENT_TYPES.find((t) => t.value === component.type);

                  return (
                    <div key={component.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                      <div
                        className="flex cursor-pointer items-center gap-2 px-4 py-3 transition hover:bg-zinc-50"
                        onClick={() => setExpandedIds((curr) => {
                          const n = new Set(curr);
                          n.has(component.id) ? n.delete(component.id) : n.add(component.id);
                          return n;
                        })}
                      >
                        <GripVertical size={14} className="text-zinc-300" />
                        <span className="w-5 font-mono text-xs text-zinc-400">{index + 1}</span>
                        <input value={component.label} onChange={(e) => updateComponent(component.id, { label: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 outline-none" />
                        <select value={component.type} onChange={(e) => updateComponent(component.id, { type: e.target.value as FormulaComponentType })}
                          onClick={(e) => e.stopPropagation()}
                          className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold outline-none", typeMeta?.className)}>
                          {COMPONENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        {val !== null && (
                          <span className={cn("text-xs font-semibold", component.is_discount ? "text-red-600" : "text-emerald-600")}>
                            {component.is_discount ? "−" : "+"}{Math.round(val).toLocaleString("uk-UA")} грн
                          </span>
                        )}
                        <label className="flex items-center gap-1 text-[10px] text-zinc-400" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={component.is_discount} onChange={(e) => updateComponent(component.id, { is_discount: e.target.checked })} />
                          знижка
                        </label>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeComponent(component.id); }}
                          className="rounded-full p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={13} />
                        </button>
                        {expanded ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
                      </div>

                      {expanded && (
                        <div className="space-y-3 border-t border-zinc-100 p-4">
                          <ExpressionEditor
                            value={component.expression}
                            onChange={(v) => updateComponent(component.id, { expression: v })}
                            presetVars={presetTokens}
                            inputVars={inputTokens}
                            testValues={testValues}
                            onTestValueChange={(key, v) => setTestValues((curr) => ({ ...curr, [key]: v }))}
                            placeholder="oak_board * width_m * height_m"
                          />
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Умова</label>
                            <input value={component.condition} onChange={(e) => updateComponent(component.id, { condition: e.target.value })}
                              className="w-full rounded-xl border border-zinc-200 px-3 py-2 font-mono text-xs outline-none focus:border-[var(--color-primary)]"
                              placeholder="has_glass == true" />
                            <p className="text-[10px] text-zinc-400">Якщо умова хибна, рядок ігнорується</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Примітка</label>
                            <input value={component.notes} onChange={(e) => updateComponent(component.id, { notes: e.target.value })}
                              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
                              placeholder="Необов'язково" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {components.length > 0 && (
                <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-5 py-3">
                  <p className="text-xs text-zinc-500">
                    Підсумок тесту: <span className="font-bold text-[var(--color-primary)]">{Math.max(0, Math.round(totalPreview)).toLocaleString("uk-UA")} грн</span>
                  </p>
                  <button type="button" onClick={() => void handleSave()} disabled={saving || !name.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-40">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {isEdit ? "Зберегти" : "Створити"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
