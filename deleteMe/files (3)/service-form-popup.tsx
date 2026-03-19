"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Check, ChevronDown, ChevronUp, GripVertical, Plus,
  Sparkles, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Feature = { title: string; description: string };
type ProcessStep = { step: number; title: string; description: string };

type Service = {
  id?: string;
  title: string;
  slug: string;
  tagline: string;
  short_description: string;
  description: string;
  icon: string;
  category: string;
  features: Feature[];
  process_steps: ProcessStep[];
  price_from: string;
  price_unit: string;
  duration_days_from: string;
  duration_days_to: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  seo_title: string;
  seo_description: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  initialData?: Partial<Service>;
  onSaved: (service: Service) => void;
};

const CATEGORIES = [
  { value: "production",    label: "🏭 Виробництво" },
  { value: "consultation",  label: "💬 Консультація" },
  { value: "installation",  label: "🔩 Монтаж" },
  { value: "restoration",   label: "🔧 Реставрація" },
];

const COMMON_ICONS = ["🚪","🪑","🪟","🔧","💬","🔩","🪵","🎨","📐","⚒️","🏠","✨"];

function slugify(v: string) {
  return v.toLowerCase().trim()
    .replace(/[аА]/g, "a").replace(/[бБ]/g, "b").replace(/[вВ]/g, "v")
    .replace(/[гГ]/g, "h").replace(/[дД]/g, "d").replace(/[еЕ]/g, "e")
    .replace(/[єЄ]/g, "ye").replace(/[жЖ]/g, "zh").replace(/[зЗ]/g, "z")
    .replace(/[иИ]/g, "y").replace(/[іІ]/g, "i").replace(/[їЇ]/g, "yi")
    .replace(/[йЙ]/g, "y").replace(/[кК]/g, "k").replace(/[лЛ]/g, "l")
    .replace(/[мМ]/g, "m").replace(/[нН]/g, "n").replace(/[оО]/g, "o")
    .replace(/[пП]/g, "p").replace(/[рР]/g, "r").replace(/[сС]/g, "s")
    .replace(/[тТ]/g, "t").replace(/[уУ]/g, "u").replace(/[фФ]/g, "f")
    .replace(/[хХ]/g, "kh").replace(/[цЦ]/g, "ts").replace(/[чЧ]/g, "ch")
    .replace(/[шШ]/g, "sh").replace(/[щЩ]/g, "shch").replace(/[ьь]/g, "")
    .replace(/[юЮ]/g, "yu").replace(/[яЯ]/g, "ya")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const EMPTY: Service = {
  title: "", slug: "", tagline: "", short_description: "",
  description: "", icon: "🚪", category: "production",
  features: [], process_steps: [],
  price_from: "", price_unit: "грн", duration_days_from: "", duration_days_to: "",
  is_active: true, is_featured: false, sort_order: 0,
  seo_title: "", seo_description: "",
};

export function ServiceFormPopup({ open, onClose, initialData, onSaved }: Props) {
  const [form, setForm] = useState<Service>({ ...EMPTY, ...initialData });
  const [slugManual, setSlugManual] = useState(!!initialData?.id);
  const [saving, setSaving] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [processOpen, setProcessOpen] = useState(true);
  const [featuresOpen, setFeaturesOpen] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const isEdit = !!form.id;

  useEffect(() => {
    setForm({ ...EMPTY, ...initialData });
    setSlugManual(!!initialData?.id);
  }, [initialData, open]);

  const set = <K extends keyof Service>(k: K, v: Service[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (k === "title" && !slugManual) {
      setForm((p) => ({ ...p, title: v as string, slug: slugify(v as string) }));
    }
  };

  const addFeature = () => set("features", [...form.features, { title: "", description: "" }]);
  const updateFeature = (i: number, patch: Partial<Feature>) =>
    set("features", form.features.map((f, idx) => idx === i ? { ...f, ...patch } : f));
  const removeFeature = (i: number) =>
    set("features", form.features.filter((_, idx) => idx !== i));

  const addStep = () => set("process_steps", [
    ...form.process_steps,
    { step: form.process_steps.length + 1, title: "", description: "" },
  ]);
  const updateStep = (i: number, patch: Partial<ProcessStep>) =>
    set("process_steps", form.process_steps.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  const removeStep = (i: number) =>
    set("process_steps", form.process_steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step: idx + 1 })));

  const generateAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/content-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "service",
          title: form.title,
          description: form.description || form.short_description,
          category: form.category,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.seoTitle) set("seo_title", data.seoTitle);
        if (data.seoDescription) set("seo_description", data.seoDescription);
        if (data.slug && !slugManual) set("slug", data.slug);
        toast.success("AI згенерував SEO та slug");
      }
    } catch {
      toast.error("Помилка AI генерації");
    }
    setAiLoading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error("Вкажіть назву та slug");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      if (form.id) fd.set("id", form.id);
      fd.set("title", form.title);
      fd.set("slug", form.slug);
      fd.set("tagline", form.tagline);
      fd.set("short_description", form.short_description);
      fd.set("description", form.description);
      fd.set("icon", form.icon);
      fd.set("category", form.category);
      fd.set("features", JSON.stringify(form.features));
      fd.set("process_steps", JSON.stringify(form.process_steps));
      fd.set("price_from", form.price_from);
      fd.set("price_unit", form.price_unit);
      fd.set("duration_days_from", form.duration_days_from);
      fd.set("duration_days_to", form.duration_days_to);
      fd.set("is_active", form.is_active ? "true" : "false");
      fd.set("is_featured", form.is_featured ? "true" : "false");
      fd.set("sort_order", String(form.sort_order));
      fd.set("seo_title", form.seo_title);
      fd.set("seo_description", form.seo_description);

      // await upsertServiceAction(fd);
      toast.success(isEdit ? "Сервіс оновлено" : "Сервіс створено");
      onSaved(form);
      onClose();
    } catch {
      toast.error("Помилка збереження");
    }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-4 pt-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4"
              style={{ background: "linear-gradient(135deg, #0d0000, #1f0505)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-xl">
                  {form.icon || "🚪"}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {isEdit ? "Редагувати сервіс" : "Новий сервіс"}
                  </h2>
                  <p className="text-xs text-white/50">/services/{form.slug || "..."}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-full p-2 text-white/60 hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            <div className="grid max-h-[82vh] overflow-y-auto lg:grid-cols-[1fr_280px]">
              {/* ── Left ── */}
              <div className="space-y-5 border-r border-[var(--color-border)] p-6">

                {/* Basic info */}
                <div className="space-y-3">
                  {/* Icon picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">Іконка</label>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_ICONS.map((ic) => (
                        <button key={ic} type="button" onClick={() => set("icon", ic)}
                          className={cn("flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition",
                            form.icon === ic
                              ? "border-[var(--color-primary)] bg-[var(--color-primary-100)]"
                              : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]")}>
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[var(--color-text-secondary)]">Назва *</label>
                        <button type="button" onClick={generateAI} disabled={aiLoading || !form.title}
                          className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-100)] disabled:opacity-40 transition">
                          <Sparkles size={10} />
                          {aiLoading ? "AI..." : "AI SEO"}
                        </button>
                      </div>
                      <input value={form.title} onChange={(e) => set("title", e.target.value)}
                        placeholder="Авторські двері"
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[var(--color-text-secondary)]">Slug *</label>
                        {slugManual && (
                          <button type="button" onClick={() => { setSlugManual(false); set("slug", slugify(form.title)); }}
                            className="text-[10px] text-[var(--color-primary)] underline">Авто</button>
                        )}
                      </div>
                      <input value={form.slug}
                        onChange={(e) => { setSlugManual(true); set("slug", slugify(e.target.value)); }}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 font-mono text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--color-text-secondary)]">Слоган</label>
                      <input value={form.tagline} onChange={(e) => set("tagline", e.target.value)}
                        placeholder="Двері, що говорять про вас"
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">Короткий опис (для картки)</label>
                    <textarea value={form.short_description} onChange={(e) => set("short_description", e.target.value)}
                      rows={2} placeholder="1-2 речення для відображення в картці сервісу"
                      className="w-full resize-none rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">Повний опис</label>
                    <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                      rows={4} placeholder="Детальний опис сервісу для сторінки..."
                      className="w-full resize-none rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                  </div>
                </div>

                {/* Features */}
                <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
                  <button type="button" onClick={() => setFeaturesOpen(!featuresOpen)}
                    className="flex w-full items-center justify-between bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/30 transition">
                    <span>✨ Переваги / особливості ({form.features.length})</span>
                    {featuresOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {featuresOpen && (
                    <div className="divide-y divide-[var(--color-border)]">
                      {form.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-3 p-3">
                          <GripVertical size={14} className="mt-2.5 shrink-0 text-[var(--color-border)]" />
                          <div className="flex-1 space-y-1.5">
                            <input value={feat.title}
                              onChange={(e) => updateFeature(i, { title: e.target.value })}
                              placeholder="Назва переваги"
                              className="w-full rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                            <input value={feat.description}
                              onChange={(e) => updateFeature(i, { description: e.target.value })}
                              placeholder="Короткий опис"
                              className="w-full rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none" />
                          </div>
                          <button type="button" onClick={() => removeFeature(i)}
                            className="mt-1.5 rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 transition">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <div className="p-3">
                        <button type="button" onClick={addFeature}
                          className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition w-full justify-center">
                          <Plus size={12} /> Додати перевагу
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Process steps */}
                <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
                  <button type="button" onClick={() => setProcessOpen(!processOpen)}
                    className="flex w-full items-center justify-between bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/30 transition">
                    <span>📋 Процес роботи ({form.process_steps.length} кроків)</span>
                    {processOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {processOpen && (
                    <div className="divide-y divide-[var(--color-border)]">
                      {form.process_steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white mt-1">
                            {step.step}
                          </div>
                          <div className="flex-1 space-y-1.5">
                            <input value={step.title}
                              onChange={(e) => updateStep(i, { title: e.target.value })}
                              placeholder="Назва кроку"
                              className="w-full rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                            <input value={step.description}
                              onChange={(e) => updateStep(i, { description: e.target.value })}
                              placeholder="Що відбувається на цьому кроці"
                              className="w-full rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none" />
                          </div>
                          <button type="button" onClick={() => removeStep(i)}
                            className="mt-1.5 rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 transition">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <div className="p-3">
                        <button type="button" onClick={addStep}
                          className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition w-full justify-center">
                          <Plus size={12} /> Додати крок
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* SEO */}
                <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
                  <button type="button" onClick={() => setSeoOpen(!seoOpen)}
                    className="flex w-full items-center justify-between bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/30 transition">
                    <span>🔍 SEO</span>
                    {seoOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {seoOpen && (
                    <div className="space-y-3 p-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-[var(--color-text-secondary)]">
                          SEO Title <span className={form.seo_title.length > 60 ? "text-amber-600" : ""}>{form.seo_title.length}/60</span>
                        </label>
                        <input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-[var(--color-text-secondary)]">
                          SEO Description <span className={form.seo_description.length > 160 ? "text-amber-600" : ""}>{form.seo_description.length}/160</span>
                        </label>
                        <textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)}
                          rows={2} className="w-full resize-none rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right ── */}
              <div className="space-y-4 p-5">
                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">Категорія</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button key={cat.value} type="button" onClick={() => set("category", cat.value)}
                        className={cn("rounded-xl border px-3 py-2 text-left text-xs font-medium transition",
                          form.category === cat.value
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                            : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]")}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">Ціноутворення</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--color-text-secondary)]">Ціна від</label>
                      <input type="number" value={form.price_from} onChange={(e) => set("price_from", e.target.value)}
                        placeholder="5000"
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--color-text-secondary)]">Одиниця</label>
                      <input value={form.price_unit} onChange={(e) => set("price_unit", e.target.value)}
                        placeholder="грн, грн/м², ..."
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">Терміни виконання (дні)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--color-text-secondary)]">Від</label>
                      <input type="number" min="1" value={form.duration_days_from}
                        onChange={(e) => set("duration_days_from", e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--color-text-secondary)]">До</label>
                      <input type="number" min="1" value={form.duration_days_to}
                        onChange={(e) => set("duration_days_to", e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Sort order */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">Порядок відображення</label>
                  <input type="number" min="0" value={form.sort_order}
                    onChange={(e) => set("sort_order", Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                </div>

                {/* Toggles */}
                <div className="space-y-2 rounded-xl border border-[var(--color-border)] p-3">
                  {[
                    { label: "Активний сервіс", key: "is_active" as keyof Service },
                    { label: "Показати на головній", key: "is_featured" as keyof Service },
                  ].map((toggle) => (
                    <label key={toggle.key} className="flex cursor-pointer items-center justify-between">
                      <span className="text-sm text-[var(--color-text-secondary)]">{toggle.label}</span>
                      <div
                        className={cn("relative h-6 w-11 rounded-full transition", form[toggle.key] ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]")}
                        onClick={() => set(toggle.key, !form[toggle.key] as any)}>
                        <div className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", form[toggle.key] ? "translate-x-5" : "translate-x-0.5")} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-6 py-4">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm">
                Скасувати
              </button>
              <button type="button" onClick={handleSave} disabled={saving || !form.title.trim()}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                <Check size={14} />
                {saving ? "Збереження..." : isEdit ? "Зберегти зміни" : "Створити сервіс"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
