"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, useCallback, useEffect, type ChangeEvent } from "react";
import {
  ArrowLeft,
  Box,
  Check,
  ChevronDown,
  Eye,
  Globe,
  ImageIcon,
  Layers,
  Link2,
  Loader2,
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
import { upsertProductAction, deleteProductAction } from "@/actions/admin/products";
import { FormulaPicker } from "@/components/admin/shared/formula-picker";
import { PhotoUploadPopup } from "@/components/admin/shared/photo-upload-popup";
import { PriorityBar } from "@/components/admin/shared/priority-bar";
import { TagInput } from "@/components/admin/shared/tag-input";
import { TranslateButton } from "@/components/admin/shared/translate-button";
import { useAiSeoAssist } from "@/hooks/use-ai-seo-assist";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import {
  buildProductModelPath,
  PRODUCT_MODEL_BUCKET,
  PRODUCT_MODEL_CONTENT_TYPE,
  PRODUCT_MODEL_MAX_SIZE_BYTES,
  isSupportedProductModelFileName,
} from "@/lib/models/product-models";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PriceFormula, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProductAttribute = { value: string; usage_count: number };

type Props = {
  initialData?: Product | null;
  formulas: PriceFormula[];
  styleAttributes: Record<string, ProductAttribute[]>;
  materialAttributes: Record<string, ProductAttribute[]>;
};

const CATEGORIES = Object.entries(PRODUCT_CATEGORY_LABELS) as [string, string][];
const STATUSES = Object.entries(PRODUCT_STATUS_LABELS) as [string, string][];

type Tab = "content" | "en" | "seo";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function getInitialPriority(d?: Product | null) {
  const p = Number((d as { priority?: number } | undefined)?.priority);
  if (Number.isFinite(p) && p >= 1 && p <= 10) return p;
  const f = Number(d?.sort_order);
  if (Number.isFinite(f) && f >= 1 && f <= 10) return f;
  return 5;
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">
      {children}
      {required && <span className="ml-1 text-rose-400">*</span>}
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
          <span className="text-zinc-400">{icon}</span>
          {title}
        </div>
        <ChevronDown size={13} className={cn("transition-transform duration-200 text-zinc-300", open && "rotate-180 text-zinc-400")} />
      </button>
      {open && <div className="border-t border-zinc-100 px-4 pb-4 pt-3 space-y-3">{children}</div>}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export function ProductForm({ initialData, formulas, styleAttributes, materialAttributes }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { generate, loading: aiLoading } = useAiSeoAssist();
  const isEdit = Boolean(initialData?.id);

  const [activeTab, setActiveTab] = useState<Tab>("content");

  // Fields
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManual, setSlugManual] = useState(isEdit);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [shortDescription, setShortDescription] = useState(initialData?.short_description ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "doors");
  const [materials, setMaterials] = useState<string[]>(initialData?.materials ?? []);
  const [styles, setStyles] = useState<string[]>(initialData?.style ?? []);
  const [status, setStatus] = useState<Product["status"]>(initialData?.status ?? "draft");
  const [priority, setPriority] = useState(getInitialPriority(initialData));
  const [sortOrder, setSortOrder] = useState(initialData?.sort_order?.toString() ?? "0");
  const [priceFrom, setPriceFrom] = useState(initialData?.price_from?.toString() ?? "");
  const [formulaId, setFormulaId] = useState(initialData?.formula_id ?? "");
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false);
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description ?? "");
  const [titleEn, setTitleEn] = useState((initialData as { title_en?: string | null } | undefined)?.title_en ?? "");
  const [descriptionEn, setDescriptionEn] = useState((initialData as { description_en?: string | null } | undefined)?.description_en ?? "");
  const [shortDescriptionEn, setShortDescriptionEn] = useState((initialData as { short_description_en?: string | null } | undefined)?.short_description_en ?? "");
  const [seoTitleEn, setSeoTitleEn] = useState((initialData as { seo_title_en?: string | null } | undefined)?.seo_title_en ?? "");
  const [seoDescriptionEn, setSeoDescriptionEn] = useState((initialData as { seo_description_en?: string | null } | undefined)?.seo_description_en ?? "");
  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
  const [coverImage, setCoverImage] = useState(initialData?.cover_image ?? "");
  const [model3dUrl, setModel3dUrl] = useState(initialData?.model_3d_url ?? "");

  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const markDirty = useCallback(() => setIsDirty(true), []);

  const categoryStyles = (styleAttributes[category] ?? []).map(i => i.value);
  const categoryMaterials = (materialAttributes[category] ?? []).map(i => i.value);
  const hasEnTranslation = !!(titleEn || descriptionEn);
  const hasSeo = !!(seoTitle || seoDescription);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugManual) setSlug(slugify(v));
    markDirty();
  };

  // ── 3D model upload ──────────────────────────────────────────────────────────
  const onModel3dUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isSupportedProductModelFileName(file.name)) { toast.error("Тільки .glb файли"); event.target.value = ""; return; }
    if (file.size > PRODUCT_MODEL_MAX_SIZE_BYTES) { toast.error("Файл завеликий. Максимум 50MB."); event.target.value = ""; return; }
    try {
      const supabase = createSupabaseBrowserClient();
      const path = buildProductModelPath(file.name);
      const uploadFile = file.type === PRODUCT_MODEL_CONTENT_TYPE ? file
        : new File([file], file.name, { type: PRODUCT_MODEL_CONTENT_TYPE, lastModified: file.lastModified });
      const { error } = await supabase.storage.from(PRODUCT_MODEL_BUCKET).upload(path, uploadFile, { contentType: PRODUCT_MODEL_CONTENT_TYPE, upsert: false });
      if (error) { toast.error("Помилка: " + error.message); return; }
      const { data } = supabase.storage.from(PRODUCT_MODEL_BUCKET).getPublicUrl(path);
      setModel3dUrl(data.publicUrl);
      markDirty();
      toast.success("3D-модель завантажено");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Помилка завантаження");
    } finally { event.target.value = ""; }
  };

  // ── AI SEO ────────────────────────────────────────────────────────────────────
  const handleAiGenerate = async () => {
    const result = await generate({ title, description, category });
    if (!result) return;
    setSeoTitle(result.seoTitle);
    setSeoDescription(result.seoDescription);
    if (!slugManual && result.slug) setSlug(result.slug);
    markDirty();
    setActiveTab("seo");
    toast.success("AI згенерував SEO-поля та slug");
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback((publishStatus: Product["status"]) => {
    startTransition(async () => {
      const resolvedCover = coverImage || images[0] || initialData?.cover_image || "";
      const fd = new FormData();
      if (isEdit && initialData?.id) fd.set("id", initialData.id);
      fd.set("title", title.trim());
      fd.set("slug", slug.trim());
      fd.set("description", description.trim());
      fd.set("short_description", shortDescription.trim());
      fd.set("category", category);
      fd.set("materials", materials.join(","));
      fd.set("style", styles.join(","));
      fd.set("status", publishStatus);
      fd.set("priority", String(priority));
      fd.set("sort_order", sortOrder || "0");
      fd.set("is_featured", isFeatured ? "true" : "false");
      fd.set("cover_image", resolvedCover);
      fd.set("model_3d_url", model3dUrl);
      fd.set("images", images.join(","));
      if (priceFrom) fd.set("price_from", priceFrom);
      if (formulaId) fd.set("formula_id", formulaId);
      if (seoTitle.trim()) fd.set("seo_title", seoTitle.trim());
      if (seoDescription.trim()) fd.set("seo_description", seoDescription.trim());
      fd.set("title_en", titleEn.trim());
      fd.set("description_en", descriptionEn.trim());
      fd.set("short_description_en", shortDescriptionEn.trim());
      fd.set("seo_title_en", seoTitleEn.trim());
      fd.set("seo_description_en", seoDescriptionEn.trim());

      const result = await upsertProductAction(fd);
      if (!result.ok) { toast.error(result.message); return; }
      toast.success(result.message);
      setIsDirty(false);
      setLastSaved(new Date());
      setStatus(publishStatus);
      if (!isEdit && result.data) {
        router.replace(`/admin/products/${result.data.id}/edit`);
      }
      router.refresh();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, description, shortDescription, category, materials, styles, priority, sortOrder, isFeatured, coverImage, model3dUrl, images, priceFrom, formulaId, seoTitle, seoDescription, titleEn, descriptionEn, shortDescriptionEn, seoTitleEn, seoDescriptionEn]);

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!initialData?.id) return;
    if (!confirm("Видалити цей продукт? Дію не можна скасувати.")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", initialData.id);
      const result = await deleteProductAction(fd);
      if (result.ok) { toast.success(result.message); router.replace("/admin/products"); }
      else toast.error(result.message);
    });
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSubmit(status); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit, status]);

  useEffect(() => {
    if (!isDirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [isDirty]);

  const TABS = [
    { id: "content" as Tab, label: "Контент", icon: <Layers size={13} /> },
    { id: "en" as Tab, label: "English", icon: <Globe size={13} />, badge: hasEnTranslation },
    { id: "seo" as Tab, label: "SEO", icon: <Search size={13} />, badge: hasSeo },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f5]">

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-5 py-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Продукти</span>
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
              <span className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                status === "active" ? "bg-emerald-50 text-emerald-700" : status === "archived" ? "bg-zinc-100 text-zinc-500" : "bg-amber-100 text-amber-700",
              )}>
                <span className={cn("h-1.5 w-1.5 rounded-full", status === "active" ? "bg-emerald-400" : status === "archived" ? "bg-zinc-300" : "bg-amber-400")} />
                {PRODUCT_STATUS_LABELS[status as keyof typeof PRODUCT_STATUS_LABELS] ?? status}
              </span>
            )}
            {isFeatured && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                <Star size={9} /> Featured
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[10px] text-zinc-300 xl:block">⌘S зберегти</span>

            {initialData?.slug && (
              <a
                href={`/products/${initialData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm"
              >
                <Eye size={13} /> Переглянути
              </a>
            )}
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm disabled:opacity-40"
            >
              <Save size={13} /> Зберегти
            </button>
            <button
              type="button"
              onClick={() => handleSubmit("active")}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-primary-700)] hover:shadow-md disabled:opacity-40"
            >
              {pending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {status === "active" ? "Оновити" : "Опублікувати"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">

          {/* ── Left ── */}
          <div className="space-y-5">

            {/* Cover / gallery preview */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-6 py-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  <ImageIcon size={11} /> Фотографії
                </p>
              </div>
              <div className="p-4">
                {coverImage && (
                  <div className="relative mb-4 aspect-[16/7] overflow-hidden rounded-xl">
                    <Image src={coverImage} alt="" fill className="object-cover" sizes="800px" />
                    <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">Обкладинка</div>
                  </div>
                )}
                <PhotoUploadPopup
                  folder="products"
                  bucket="product-images"
                  images={images}
                  coverImage={coverImage}
                  onImagesChange={(nextImages, nextCover) => {
                    setImages(nextImages);
                    setCoverImage(nextCover);
                    markDirty();
                  }}
                />
              </div>
            </div>

            {/* Tabs + content card */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">

              {/* Tab bar */}
              <div className="flex items-center gap-1 border-b border-zinc-100 bg-zinc-50/80 px-4 py-2">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      activeTab === tab.id ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800",
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.badge && (
                      <span className={cn("rounded-full px-1 py-0.5 text-[9px] font-bold", activeTab === tab.id ? "bg-emerald-100 text-emerald-700" : "bg-emerald-100 text-emerald-700")}>✓</span>
                    )}
                  </button>
                ))}

                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => void handleAiGenerate()}
                    disabled={aiLoading || (!title && !description)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                      aiLoading || (!title && !description)
                        ? "cursor-not-allowed text-zinc-300"
                        : "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm hover:opacity-90",
                    )}
                  >
                    {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                    AI SEO
                  </button>
                </div>
              </div>

              {/* ── Контент tab ── */}
              {activeTab === "content" && (
                <div className="space-y-6 p-6">

                  {/* Title */}
                  <div>
                    <FieldLabel required>Назва</FieldLabel>
                    <input
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      required
                      placeholder="Назва продукту"
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
                        <button type="button" onClick={() => { setSlugManual(false); setSlug(slugify(title)); }} className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-primary)] hover:underline">
                          <RefreshCw size={9} /> Авто з назви
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 transition-all focus-within:border-[var(--color-primary-300)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--color-primary-100)]">
                      <Link2 size={12} className="shrink-0 text-zinc-300" />
                      <span className="text-xs text-zinc-400">/products/</span>
                      <input
                        value={slug}
                        onChange={(e) => { setSlugManual(true); setSlug(slugify(e.target.value)); markDirty(); }}
                        required
                        className="min-w-0 flex-1 bg-transparent text-sm text-zinc-700 outline-none"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <FieldLabel required>Опис продукту</FieldLabel>
                    <FormTextarea
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                      required
                      rows={5}
                      placeholder="Детальний опис — характеристики, особливості, переваги…"
                    />
                  </div>

                  {/* Short description */}
                  <div>
                    <FieldLabel>Короткий опис</FieldLabel>
                    <FormTextarea
                      value={shortDescription}
                      onChange={(e) => { setShortDescription(e.target.value); markDirty(); }}
                      rows={3}
                      placeholder="Для карток та попереднього перегляду"
                    />
                  </div>

                  {/* Attributes */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TagInput value={styles} onChange={(v) => { setStyles(v); markDirty(); }} suggestions={categoryStyles} label="Стилі" placeholder="Додати стиль..." />
                    <TagInput value={materials} onChange={(v) => { setMaterials(v); markDirty(); }} suggestions={categoryMaterials} label="Матеріали" placeholder="Додати матеріал..." />
                  </div>
                </div>
              )}

              {/* ── EN tab ── */}
              {activeTab === "en" && (
                <div className="space-y-5 p-6">
                  <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-indigo-400" />
                      <p className="text-xs font-semibold text-indigo-700">🇬🇧 Переклад для англомовних користувачів</p>
                    </div>
                    {isEdit && initialData?.id && (
                      <TranslateButton
                        table="products"
                        id={initialData.id}
                        fields={{ title, description, short_description: shortDescription, seo_title: seoTitle, seo_description: seoDescription }}
                        onSuccess={(t) => {
                          if (t.title_en) setTitleEn(t.title_en);
                          if (t.description_en) setDescriptionEn(t.description_en);
                          if (t.short_description_en) setShortDescriptionEn(t.short_description_en);
                          if (t.seo_title_en) setSeoTitleEn(t.seo_title_en);
                          if (t.seo_description_en) setSeoDescriptionEn(t.seo_description_en);
                          markDirty();
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <FieldLabel>Назва (EN)</FieldLabel>
                    <FormInput value={titleEn} onChange={(e) => { setTitleEn(e.target.value); markDirty(); }} placeholder="Product name in English" />
                  </div>
                  <div>
                    <FieldLabel>Опис (EN)</FieldLabel>
                    <FormTextarea value={descriptionEn} onChange={(e) => { setDescriptionEn(e.target.value); markDirty(); }} rows={5} placeholder="Full description in English" />
                  </div>
                  <div>
                    <FieldLabel>Короткий опис (EN)</FieldLabel>
                    <FormTextarea value={shortDescriptionEn} onChange={(e) => { setShortDescriptionEn(e.target.value); markDirty(); }} rows={3} placeholder="Short description in English" />
                  </div>

                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">SEO (EN)</p>
                    <div>
                      <FieldLabel>SEO Title EN</FieldLabel>
                      <FormInput value={seoTitleEn} onChange={(e) => { setSeoTitleEn(e.target.value); markDirty(); }} maxLength={60} placeholder="SEO title in English..." />
                      <CharBar value={seoTitleEn.length} max={60} warnAt={50} />
                    </div>
                    <div>
                      <FieldLabel>SEO Description EN</FieldLabel>
                      <FormTextarea value={seoDescriptionEn} onChange={(e) => { setSeoDescriptionEn(e.target.value); markDirty(); }} rows={2} maxLength={160} placeholder="SEO description in English..." />
                      <CharBar value={seoDescriptionEn.length} max={160} warnAt={140} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── SEO tab ── */}
              {activeTab === "seo" && (
                <div className="space-y-5 p-6">
                  <button
                    type="button"
                    onClick={() => void handleAiGenerate()}
                    disabled={aiLoading || (!title && !description)}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-sm transition-all",
                      aiLoading || (!title && !description)
                        ? "cursor-not-allowed bg-zinc-100 text-zinc-300"
                        : "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-90 hover:shadow-md",
                    )}
                  >
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Згенерувати SEO з AI
                  </button>
                  <div>
                    <FieldLabel>SEO Title</FieldLabel>
                    <FormInput value={seoTitle} onChange={(e) => { setSeoTitle(e.target.value); markDirty(); }} maxLength={60} placeholder="Заголовок для пошуку..." />
                    <CharBar value={seoTitle.length} max={60} warnAt={50} />
                  </div>
                  <div>
                    <FieldLabel>SEO Description</FieldLabel>
                    <FormTextarea value={seoDescription} onChange={(e) => { setSeoDescription(e.target.value); markDirty(); }} rows={4} maxLength={160} placeholder="Короткий опис для пошуку..." />
                    <CharBar value={seoDescription.length} max={160} warnAt={140} />
                  </div>
                  {(seoTitle || title) && (
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Прев'ю в Google</p>
                      <div className="text-[11px] text-emerald-700">svitlytsya-maystra.com/products/{slug || "..."}</div>
                      <div className="mt-0.5 text-sm font-medium text-blue-700 line-clamp-1">{(seoTitle || title).slice(0, 60)}</div>
                      <div className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{(seoDescription || shortDescription || description).slice(0, 160)}</div>
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
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value as Product["status"]); markDirty(); }}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 outline-none transition-all focus:border-[var(--color-primary-300)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-100)]"
                >
                  {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 transition-all hover:bg-zinc-100">
                  <div className="flex items-center gap-2">
                    <Star size={13} className={isFeatured ? "text-amber-500" : "text-zinc-300"} />
                    <span className="text-sm font-medium text-zinc-700">На головній (Featured)</span>
                  </div>
                  <div
                    onClick={() => { setIsFeatured(!isFeatured); markDirty(); }}
                    className={cn("relative h-5 w-9 rounded-full transition-all duration-200 shadow-inner", isFeatured ? "bg-amber-400" : "bg-zinc-200")}
                  >
                    <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200", isFeatured ? "left-4" : "left-0.5")} />
                  </div>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 px-4 py-3">
                <button type="button" onClick={() => handleSubmit("draft")} disabled={pending}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-600 transition-all hover:bg-zinc-50 hover:shadow-sm disabled:opacity-40">
                  <Save size={13} /> Чернетка
                </button>
                <button type="button" onClick={() => handleSubmit("active")} disabled={pending}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-primary-700)] hover:shadow-md disabled:opacity-40">
                  {pending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {status === "active" ? "Оновити" : "Опублікувати"}
                </button>
              </div>
            </div>

            {/* Category */}
            <SideCard title="Категорія" icon={<Layers size={14} />}>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map(([v, l]) => (
                  <button key={v} type="button" onClick={() => { setCategory(v); markDirty(); }}
                    className={cn("rounded-xl border px-2 py-2 text-xs font-semibold transition-all",
                      category === v ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50")}>
                    {l}
                  </button>
                ))}
              </div>
            </SideCard>

            {/* 3D Model */}
            <SideCard title="3D-модель" icon={<Box size={14} />} defaultOpen={false}>
              {model3dUrl ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                  <Check size={13} className="text-emerald-500" />
                  <span className="flex-1 truncate text-xs font-medium text-emerald-700">Модель завантажена</span>
                  <button type="button" onClick={() => { setModel3dUrl(""); markDirty(); }} className="text-[10px] text-rose-500 hover:underline">Видалити</button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 px-3 py-4 text-xs text-zinc-400 transition-all hover:border-zinc-300 hover:bg-zinc-50">
                  <Box size={14} /> Завантажити .glb файл
                  <input type="file" accept=".glb" onChange={(e) => void onModel3dUpload(e)} className="hidden" />
                </label>
              )}
              <p className="text-[10px] leading-relaxed text-zinc-400">Формат: .glb без зовнішніх залежностей. До 5MB.</p>
              <input type="hidden" name="model_3d_url" value={model3dUrl} />
            </SideCard>

            {/* Priority */}
            <SideCard title="Пріоритет" icon={<Star size={14} />}>
              <PriorityBar value={priority} onChange={(v) => { setPriority(v); markDirty(); }} label="" />
            </SideCard>

            {/* Pricing */}
            <SideCard title="Ціноутворення" icon={<Send size={14} />}>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Ціна від (грн)</label>
                <FormInput type="number" min="0" value={priceFrom} onChange={(e) => { setPriceFrom(e.target.value); markDirty(); }} placeholder="Необов'язково" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Формула</label>
                <FormulaPicker formulas={formulas} value={formulaId} onChange={(v) => { setFormulaId(v); markDirty(); }} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Порядок сортування</label>
                <FormInput type="number" min="0" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value); markDirty(); }} />
              </div>
            </SideCard>

            {/* Danger zone */}
            {isEdit && (
              <SideCard title="Небезпечна зона" icon={<Trash2 size={14} />} defaultOpen={false}>
                <p className="text-xs text-red-500">Видалення продукту є незворотною дією.</p>
                <button type="button" onClick={handleDelete} disabled={pending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md disabled:opacity-50">
                  <Trash2 size={14} /> Видалити продукт
                </button>
              </SideCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
