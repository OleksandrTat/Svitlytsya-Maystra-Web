"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  Languages,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteServiceAction,
  upsertServiceAction,
} from "@/actions/admin";
import { CategoryCombobox, type CategoryLabels } from "@/components/admin/shared/category-combobox";
import { CoverImageUpload } from "@/components/admin/shared/cover-image-upload";
import { requestContentAssist } from "@/lib/admin/request-content-assist";
import type { Service, ServiceFeature, ServiceProcessStep } from "@/lib/types";
import { slugify, cn } from "@/lib/utils";

type Props = {
  initialData?: Service | null;
  allCategories?: string[];
  categoryLabels?: CategoryLabels;
};

type FormState = {
  id?: string;
  title: string;
  slug: string;
  tagline: string;
  short_description: string;
  description: string;
  cover_image: string;
  category: string;
  features: ServiceFeature[];
  process_steps: ServiceProcessStep[];
  price_from: string;
  price_unit: string;
  duration_days_from: string;
  duration_days_to: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  seo_title: string;
  seo_description: string;
  title_en: string;
  tagline_en: string;
  short_description_en: string;
  description_en: string;
  seo_title_en: string;
  seo_description_en: string;
};

type Tab = "uk" | "en";

function makeInitialState(s?: Service | null): FormState {
  const srv = s as (Service & { title_en?: string | null; tagline_en?: string | null; short_description_en?: string | null; description_en?: string | null; seo_title_en?: string | null; seo_description_en?: string | null }) | null | undefined;
  return {
    id: srv?.id,
    title: srv?.title ?? "",
    slug: srv?.slug ?? "",
    tagline: srv?.tagline ?? "",
    short_description: srv?.short_description ?? "",
    description: srv?.description ?? "",
    cover_image: srv?.cover_image ?? "",
    category: srv?.category ?? "",
    features: srv?.features ?? [],
    process_steps: srv?.process_steps ?? [],
    price_from: srv?.price_from ? String(srv.price_from) : "",
    price_unit: srv?.price_unit ?? "грн",
    duration_days_from: srv?.duration_days_from ? String(srv.duration_days_from) : "",
    duration_days_to: srv?.duration_days_to ? String(srv.duration_days_to) : "",
    is_active: srv?.is_active ?? true,
    is_featured: srv?.is_featured ?? false,
    sort_order: srv?.sort_order ?? 0,
    seo_title: srv?.seo_title ?? "",
    seo_description: srv?.seo_description ?? "",
    title_en: srv?.title_en ?? "",
    tagline_en: srv?.tagline_en ?? "",
    short_description_en: srv?.short_description_en ?? "",
    description_en: srv?.description_en ?? "",
    seo_title_en: srv?.seo_title_en ?? "",
    seo_description_en: srv?.seo_description_en ?? "",
  };
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">
      {children}{required && <span className="ml-1 text-rose-400">*</span>}
    </label>
  );
}

function FormInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 outline-none transition-all",
        "focus:border-[var(--color-primary-300)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-100)]",
        className,
      )}
    />
  );
}

function FormTextarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 outline-none transition-all",
        "focus:border-[var(--color-primary-300)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-100)]",
        className,
      )}
    />
  );
}

function CharBar({ value, max, warnAt }: { value: number; max: number; warnAt: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const warn = value > warnAt;
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
        <div className={cn("h-0.5 rounded-full transition-all", warn ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-[10px] tabular-nums", warn ? "text-amber-500" : "text-zinc-400")}>{value}/{max}</span>
    </div>
  );
}

function SideCard({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button type="button" onClick={() => setOpen(v => !v)} className="flex w-full items-center justify-between px-4 py-3 hover:bg-zinc-50/80 transition-colors">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
          <span className="text-zinc-400">{icon}</span>{title}
        </div>
        <ChevronDown size={13} className={cn("transition-transform duration-200 text-zinc-300", open && "rotate-180 text-zinc-400")} />
      </button>
      {open && <div className="border-t border-zinc-100 px-4 pb-4 pt-3 space-y-3">{children}</div>}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 group">
      <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">{label}</span>
      <div onClick={() => onChange(!checked)} className={cn("relative h-5 w-9 rounded-full transition-all duration-200 shadow-inner", checked ? "bg-[var(--color-primary)]" : "bg-zinc-200")}>
        <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200", checked ? "left-4" : "left-0.5")} />
      </div>
    </label>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-zinc-100" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{label}</span>
      <div className="h-px flex-1 bg-zinc-100" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function ServiceForm({ initialData, allCategories = [], categoryLabels }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(initialData?.id);
  const [catLabels, setCatLabels] = useState<CategoryLabels>(categoryLabels ?? {});

  const [form, setForm] = useState<FormState>(makeInitialState(initialData));
  const [slugManual, setSlugManual] = useState(isEdit);
  const [aiSeoLoading, setAiSeoLoading] = useState(false);
  const [aiTranslating, setAiTranslating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("uk");

  const markDirty = useCallback(() => setIsDirty(true), []);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(curr => {
      const next = { ...curr, [key]: value };
      if (key === "title" && !slugManual) next.slug = slugify(String(value));
      return next;
    });
    markDirty();
  }, [slugManual, markDirty]);

  const updateFeature = (i: number, patch: Partial<ServiceFeature>) => {
    setForm(curr => ({ ...curr, features: curr.features.map((f, idx) => idx === i ? { ...f, ...patch } : f) }));
    markDirty();
  };
  const removeFeature = (i: number) => {
    setForm(curr => ({ ...curr, features: curr.features.filter((_, idx) => idx !== i) }));
    markDirty();
  };
  const addFeature = () => {
    setForm(curr => ({ ...curr, features: [...curr.features, { title: "", description: "" }] }));
    markDirty();
  };

  const updateStep = (i: number, patch: Partial<ServiceProcessStep>) => {
    setForm(curr => ({ ...curr, process_steps: curr.process_steps.map((s, idx) => idx === i ? { ...s, ...patch } : s) }));
    markDirty();
  };
  const removeStep = (i: number) => {
    setForm(curr => ({
      ...curr,
      process_steps: curr.process_steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step: idx + 1 })),
    }));
    markDirty();
  };
  const addStep = () => {
    setForm(curr => ({ ...curr, process_steps: [...curr.process_steps, { step: curr.process_steps.length + 1, title: "", description: "" }] }));
    markDirty();
  };

  // ── AI SEO (UK) ───────────────────────────────────────────────────────────
  const generateSeo = async () => {
    if (!form.title.trim()) { toast.error("Вкажіть назву сервісу"); return; }
    setAiSeoLoading(true);
    try {
      const content = [form.description, form.short_description, form.tagline].filter(Boolean).join(" ");
      const result = await requestContentAssist({ title: form.title, content });
      setForm(curr => ({
        ...curr,
        short_description: curr.short_description || result.excerpt,
        seo_title: result.seoTitle,
        seo_description: result.seoDescription,
      }));
      markDirty();
      toast.success("SEO поля згенеровано");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не вдалося звернутися до AI");
    } finally {
      setAiSeoLoading(false);
    }
  };

  // ── AI Full Translation (EN) ───────────────────────────────────────────────
  const translateAll = async () => {
    if (!form.id) { toast.error("Спочатку збережіть сервіс, щоб отримати ID"); return; }
    if (!form.title.trim()) { toast.error("Немає контенту для перекладу"); return; }

    setAiTranslating(true);
    try {
      const fields: Record<string, string> = {};
      if (form.title.trim()) fields.title = form.title;
      if (form.tagline.trim()) fields.tagline = form.tagline;
      if (form.short_description.trim()) fields.short_description = form.short_description;
      if (form.description.trim()) fields.description = form.description;
      if (form.seo_title.trim()) fields.seo_title = form.seo_title;
      if (form.seo_description.trim()) fields.seo_description = form.seo_description;

      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: "services", id: form.id, fields }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; translations?: Record<string, string> };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Translation failed");

      const tr = data.translations ?? {};
      setForm(curr => ({
        ...curr,
        title_en: tr.title_en ?? curr.title_en,
        tagline_en: tr.tagline_en ?? curr.tagline_en,
        short_description_en: tr.short_description_en ?? curr.short_description_en,
        description_en: tr.description_en ?? curr.description_en,
        seo_title_en: tr.seo_title_en ?? curr.seo_title_en,
        seo_description_en: tr.seo_description_en ?? curr.seo_description_en,
      }));
      toast.success("Повний переклад виконано");
    } catch {
      toast.error("Помилка перекладу. Перевірте налаштування OpenAI.");
    } finally {
      setAiTranslating(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback((active: boolean) => {
    if (!form.title.trim() || !form.slug.trim()) { toast.error("Заповніть назву і slug"); return; }
    startTransition(async () => {
      const fd = new FormData();
      if (form.id) fd.set("id", form.id);
      fd.set("title", form.title.trim());
      fd.set("slug", form.slug.trim());
      fd.set("tagline", form.tagline.trim());
      fd.set("short_description", form.short_description.trim());
      fd.set("description", form.description.trim());
      fd.set("cover_image", form.cover_image.trim());
      fd.set("category", form.category);
      fd.set("title_en", form.title_en.trim());
      fd.set("tagline_en", form.tagline_en.trim());
      fd.set("short_description_en", form.short_description_en.trim());
      fd.set("description_en", form.description_en.trim());
      fd.set("seo_title_en", form.seo_title_en.trim());
      fd.set("seo_description_en", form.seo_description_en.trim());
      fd.set("features", JSON.stringify(form.features.filter(f => f.title.trim())));
      fd.set("process_steps", JSON.stringify(
        form.process_steps.filter(s => s.title.trim()).map((s, i) => ({ step: i + 1, title: s.title.trim(), description: s.description.trim() }))
      ));
      fd.set("price_from", form.price_from.trim());
      fd.set("price_unit", form.price_unit.trim());
      fd.set("duration_days_from", form.duration_days_from.trim());
      fd.set("duration_days_to", form.duration_days_to.trim());
      fd.set("is_active", String(active));
      fd.set("is_featured", String(form.is_featured));
      fd.set("sort_order", String(form.sort_order));
      fd.set("seo_title", form.seo_title.trim());
      fd.set("seo_description", form.seo_description.trim());
      fd.set("category_labels", JSON.stringify(catLabels));

      const result = await upsertServiceAction(fd);
      if (!result.ok) { toast.error(result.message); return; }
      toast.success(result.message);
      setIsDirty(false);
      setLastSaved(new Date());
      setForm(curr => ({ ...curr, is_active: active }));
      if (!isEdit && result.data) {
        router.replace(`/admin/services/${result.data.id}/edit`);
      }
      router.refresh();
    });
  }, [form, isEdit, router, catLabels]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!form.id || !confirm("Видалити цей сервіс? Дію не можна скасувати.")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", form.id!);
      const result = await deleteServiceAction(fd);
      if (result.ok) { toast.success(result.message); router.replace("/admin/services"); }
      else toast.error(result.message);
    });
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(form.is_active); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleSave, form.is_active]);

  useEffect(() => {
    if (!isDirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [isDirty]);

  const hasEnContent = !!(form.title_en);

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f5]">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-5 py-3">
          <button type="button" onClick={() => router.push("/admin/services")}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900">
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Послуги</span>
          </button>
          <div className="h-4 w-px bg-zinc-200" />

          {/* Status */}
          <div className="flex items-center gap-2">
            {pending ? (
              <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">
                <Loader2 size={11} className="animate-spin" /> Збереження…
              </span>
            ) : isDirty ? (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Незбережені зміни
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                <Check size={11} /> {lastSaved.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : (
              <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                form.is_active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", form.is_active ? "bg-emerald-400" : "bg-zinc-300")} />
                {form.is_active ? "Активний" : "Неактивний"}
              </span>
            )}
            {form.is_featured && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                <Star size={9} /> Featured
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[10px] text-zinc-300 xl:block">⌘S зберегти</span>
            {initialData?.slug && (
              <a href={`/services/${initialData.slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm">
                <Eye size={13} /> Переглянути
              </a>
            )}
            <button type="button" onClick={() => handleSave(false)} disabled={pending}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm disabled:opacity-40">
              <Save size={13} /> Зберегти
            </button>
            <button type="button" onClick={() => handleSave(true)} disabled={pending}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-primary-700)] hover:shadow-md disabled:opacity-40">
              {pending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {form.is_active ? "Оновити" : "Активувати"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">

          {/* ── Left ── */}
          <div className="space-y-5">

            {/* Main content card with tabs */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">

              {/* Tab bar */}
              <div className="flex items-center gap-1 border-b border-zinc-100 bg-zinc-50/80 px-4 py-2">
                <button type="button" onClick={() => setActiveTab("uk")}
                  className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    activeTab === "uk" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800")}>
                  🇺🇦 Українська
                </button>
                <button type="button" onClick={() => setActiveTab("en")}
                  className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                    activeTab === "en" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800")}>
                  🇬🇧 English
                  {hasEnContent && <span className="rounded-full bg-emerald-100 px-1 py-0.5 text-[9px] font-bold text-emerald-700">✓</span>}
                </button>
              </div>

              {/* ── 🇺🇦 Ukrainian tab ── */}
              {activeTab === "uk" && (
                <div className="space-y-6 p-6">

                  {/* Title */}
                  <div>
                    <FieldLabel required>Назва</FieldLabel>
                    <input
                      value={form.title}
                      onChange={e => setField("title", e.target.value)}
                      placeholder="Авторські двері"
                      className={cn(
                        "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 font-[Cormorant,serif] text-3xl font-bold text-zinc-900 outline-none transition-all",
                        "placeholder:text-zinc-300 focus:border-[var(--color-primary-300)] focus:ring-2 focus:ring-[var(--color-primary-100)]",
                      )}
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <FieldLabel>Slug / URL</FieldLabel>
                      {slugManual && (
                        <button type="button" onClick={() => { setSlugManual(false); setField("slug", slugify(form.title)); }}
                          className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-primary)] hover:underline">
                          <RefreshCw size={9} /> Авто з назви
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 transition-all focus-within:border-[var(--color-primary-300)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--color-primary-100)]">
                      <Link2 size={12} className="shrink-0 text-zinc-300" />
                      <span className="text-xs text-zinc-400">/services/</span>
                      <input value={form.slug} onChange={e => { setSlugManual(true); setField("slug", slugify(e.target.value)); }}
                        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-700 outline-none" />
                    </div>
                  </div>

                  {/* Tagline */}
                  <div>
                    <FieldLabel>Слоган</FieldLabel>
                    <FormInput value={form.tagline} onChange={e => setField("tagline", e.target.value)} placeholder="Коротка приваблива фраза…" />
                  </div>

                  {/* Short description */}
                  <div>
                    <FieldLabel required>Короткий опис</FieldLabel>
                    <FormTextarea value={form.short_description} onChange={e => setField("short_description", e.target.value)} rows={3} placeholder="Для карток і попереднього перегляду…" />
                  </div>

                  {/* Description */}
                  <div>
                    <FieldLabel>Повний опис</FieldLabel>
                    <FormTextarea value={form.description} onChange={e => setField("description", e.target.value)} rows={6} placeholder="Детальний опис сервісу…" />
                  </div>

                  {/* Cover image */}
                  <div>
                    <FieldLabel>Обкладинка</FieldLabel>
                    <CoverImageUpload
                      value={form.cover_image}
                      onChange={(url) => setField("cover_image", url)}
                      bucket="service-images"
                      folder="services"
                    />
                  </div>

                  <SectionDivider label="Переваги та процес" />

                  {/* Features */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <FieldLabel>Переваги сервісу {form.features.length > 0 && `(${form.features.length})`}</FieldLabel>
                      <button type="button" onClick={addFeature}
                        className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200">
                        <Plus size={11} /> Додати
                      </button>
                    </div>
                    {form.features.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-zinc-200 py-6 text-center">
                        <p className="text-sm text-zinc-400">Немає переваг. Натисніть «Додати».</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {form.features.map((f, i) => (
                          <div key={i} className="grid items-center gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
                            <FormInput value={f.title} onChange={e => updateFeature(i, { title: e.target.value })} placeholder="Назва переваги" />
                            <FormInput value={f.description} onChange={e => updateFeature(i, { description: e.target.value })} placeholder="Пояснення" />
                            <button type="button" onClick={() => removeFeature(i)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Process steps */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <FieldLabel>Етапи роботи {form.process_steps.length > 0 && `(${form.process_steps.length})`}</FieldLabel>
                      <button type="button" onClick={addStep}
                        className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200">
                        <Plus size={11} /> Додати
                      </button>
                    </div>
                    {form.process_steps.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-zinc-200 py-6 text-center">
                        <p className="text-sm text-zinc-400">Немає етапів. Натисніть «Додати».</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {form.process_steps.map((s, i) => (
                          <div key={i} className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2">
                              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Крок {i + 1}</span>
                              <button type="button" onClick={() => removeStep(i)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-red-50 hover:text-red-500">
                                <Trash2 size={11} />
                              </button>
                            </div>
                            <div className="grid gap-3 p-3 sm:grid-cols-2">
                              <FormInput value={s.title} onChange={e => updateStep(i, { title: e.target.value })} placeholder="Назва етапу" />
                              <FormInput value={s.description} onChange={e => updateStep(i, { description: e.target.value })} placeholder="Пояснення" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <SectionDivider label="SEO" />

                  {/* AI SEO button */}
                  <button type="button" onClick={() => void generateSeo()} disabled={aiSeoLoading || !form.title.trim()}
                    className={cn("flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold shadow-sm transition-all",
                      aiSeoLoading || !form.title.trim()
                        ? "cursor-not-allowed bg-zinc-100 text-zinc-300"
                        : "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-90 hover:shadow-md")}>
                    {aiSeoLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Згенерувати SEO з AI
                  </button>

                  {/* SEO Title */}
                  <div>
                    <FieldLabel>SEO Title</FieldLabel>
                    <FormInput value={form.seo_title} onChange={e => setField("seo_title", e.target.value)} maxLength={60} placeholder="Заголовок для пошуку…" />
                    <CharBar value={form.seo_title.length} max={60} warnAt={50} />
                  </div>

                  {/* SEO Description */}
                  <div>
                    <FieldLabel>SEO Description</FieldLabel>
                    <FormTextarea value={form.seo_description} onChange={e => setField("seo_description", e.target.value)} rows={3} maxLength={160} placeholder="Короткий опис для пошуку…" />
                    <CharBar value={form.seo_description.length} max={160} warnAt={140} />
                  </div>

                  {/* Google preview */}
                  {(form.seo_title || form.title) && (
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <Search size={9} /> Прев'ю в Google
                      </p>
                      <div className="text-[11px] text-emerald-700">svitlytsya-maystra.com/services/{form.slug || "…"}</div>
                      <div className="mt-0.5 text-sm font-medium text-blue-700 line-clamp-1">{(form.seo_title || form.title).slice(0, 60)}</div>
                      <div className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{(form.seo_description || form.short_description).slice(0, 160)}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 🇬🇧 English tab ── */}
              {activeTab === "en" && (
                <div className="space-y-5 p-6">

                  {/* AI Translate button */}
                  {form.id ? (
                    <button
                      type="button"
                      onClick={() => void translateAll()}
                      disabled={aiTranslating || !form.title.trim()}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-sm transition-all",
                        aiTranslating || !form.title.trim()
                          ? "cursor-not-allowed bg-zinc-100 text-zinc-300"
                          : "bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:opacity-90 hover:shadow-md",
                      )}>
                      {aiTranslating ? <Loader2 size={15} className="animate-spin" /> : <Languages size={15} />}
                      {aiTranslating ? "Перекладаємо…" : "Повний переклад з AI (UK → EN)"}
                    </button>
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                      <span className="mt-0.5 text-amber-400">⚠</span>
                      <p className="text-xs text-amber-700">
                        Збережіть сервіс спочатку, щоб активувати AI-переклад.
                      </p>
                    </div>
                  )}

                  {/* Title EN */}
                  <div>
                    <FieldLabel>Назва (EN)</FieldLabel>
                    <input
                      value={form.title_en}
                      onChange={e => setField("title_en", e.target.value)}
                      placeholder="Service name in English"
                      className={cn(
                        "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 font-[Cormorant,serif] text-3xl font-bold text-zinc-900 outline-none transition-all",
                        "placeholder:text-zinc-300 focus:border-[var(--color-primary-300)] focus:ring-2 focus:ring-[var(--color-primary-100)]",
                      )}
                    />
                  </div>

                  {/* Tagline EN */}
                  <div>
                    <FieldLabel>Слоган (EN)</FieldLabel>
                    <FormInput value={form.tagline_en} onChange={e => setField("tagline_en", e.target.value)} placeholder="Short tagline in English" />
                  </div>

                  {/* Short description EN */}
                  <div>
                    <FieldLabel>Короткий опис (EN)</FieldLabel>
                    <FormTextarea value={form.short_description_en} onChange={e => setField("short_description_en", e.target.value)} rows={3} placeholder="Short description in English…" />
                  </div>

                  {/* Description EN */}
                  <div>
                    <FieldLabel>Повний опис (EN)</FieldLabel>
                    <FormTextarea value={form.description_en} onChange={e => setField("description_en", e.target.value)} rows={6} placeholder="Full description in English…" />
                  </div>

                  <SectionDivider label="SEO (EN)" />

                  {/* SEO Title EN */}
                  <div>
                    <FieldLabel>SEO Title (EN)</FieldLabel>
                    <FormInput value={form.seo_title_en} onChange={e => setField("seo_title_en", e.target.value)} maxLength={60} placeholder="SEO title in English…" />
                    <CharBar value={form.seo_title_en.length} max={60} warnAt={50} />
                  </div>

                  {/* SEO Description EN */}
                  <div>
                    <FieldLabel>SEO Description (EN)</FieldLabel>
                    <FormTextarea value={form.seo_description_en} onChange={e => setField("seo_description_en", e.target.value)} rows={3} maxLength={160} placeholder="SEO description in English…" />
                    <CharBar value={form.seo_description_en.length} max={160} warnAt={140} />
                  </div>

                  {/* Google preview EN */}
                  {(form.seo_title_en || form.title_en) && (
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        <Search size={9} /> Google Preview (EN)
                      </p>
                      <div className="text-[11px] text-emerald-700">svitlytsya-maystra.com/en/services/{form.slug || "…"}</div>
                      <div className="mt-0.5 text-sm font-medium text-blue-700 line-clamp-1">{(form.seo_title_en || form.title_en).slice(0, 60)}</div>
                      <div className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{(form.seo_description_en || form.short_description_en).slice(0, 160)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-4">

            {/* Publish card */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Публікація</p>
              </div>
              <div className="space-y-3 px-4 py-4">
                <Toggle checked={form.is_active} onChange={v => setField("is_active", v)} label="Активний сервіс" />
                <Toggle checked={form.is_featured} onChange={v => setField("is_featured", v)} label="На головній (Featured)" />
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 px-4 py-3">
                <button type="button" onClick={() => handleSave(false)} disabled={pending}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-600 transition-all hover:bg-zinc-50 hover:shadow-sm disabled:opacity-40">
                  <Save size={13} /> Зберегти
                </button>
                <button type="button" onClick={() => handleSave(true)} disabled={pending}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-primary-700)] hover:shadow-md disabled:opacity-40">
                  {pending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {form.is_active ? "Оновити" : "Активувати"}
                </button>
              </div>
            </div>

            {/* Category */}
            <SideCard title="Категорія" icon={<span className="text-xs">📂</span>}>
              <CategoryCombobox
                value={form.category}
                onChange={(v) => { setField("category", v); }}
                allCategories={allCategories}
                labels={catLabels}
                onLabelsChange={setCatLabels}
              />
            </SideCard>

            {/* Pricing & duration */}
            <SideCard title="Ціна та терміни" icon={<span className="text-xs">💰</span>}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Ціна від</label>
                  <FormInput type="number" min="0" value={form.price_from} onChange={e => setField("price_from", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Одиниця</label>
                  <FormInput value={form.price_unit} onChange={e => setField("price_unit", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Термін від (днів)</label>
                  <FormInput type="number" min="1" value={form.duration_days_from} onChange={e => setField("duration_days_from", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Термін до (днів)</label>
                  <FormInput type="number" min="1" value={form.duration_days_to} onChange={e => setField("duration_days_to", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Порядок сортування</label>
                <FormInput type="number" min="0" value={form.sort_order} onChange={e => setField("sort_order", Number(e.target.value) || 0)} />
              </div>
            </SideCard>

            {/* Danger zone */}
            {isEdit && (
              <SideCard title="Небезпечна зона" icon={<Trash2 size={14} />} defaultOpen={false}>
                <p className="text-xs text-red-500">Видалення сервісу є незворотною дією.</p>
                <button type="button" onClick={handleDelete} disabled={pending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md disabled:opacity-50">
                  <Trash2 size={14} /> Видалити сервіс
                </button>
              </SideCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
