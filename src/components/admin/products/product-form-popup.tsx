"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Box,
  Sparkles,
  X,
  Star,
  Search,
  Globe,
  Layers,
  Image as ImageIcon,
  ChevronRight,
  Loader2,
  Zap,
  Link2,
  RefreshCw,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { upsertProductAction } from "@/actions/admin/products";
import { FormulaPicker } from "@/components/admin/shared/formula-picker";
import { PhotoUploadPopup } from "@/components/admin/shared/photo-upload-popup";
import { PriorityBar } from "@/components/admin/shared/priority-bar";
import { TagInput } from "@/components/admin/shared/tag-input";
import { TranslateButton } from "@/components/admin/shared/translate-button";
import { useAiSeoAssist } from "@/hooks/use-ai-seo-assist";
import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
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

type Props = {
  open: boolean;
  onClose: () => void;
  formulas: PriceFormula[];
  allStyles: string[];
  allMaterials: string[];
  allCategories: string[];
  initialData?: Partial<Product>;
};

const STATUSES = Object.entries(PRODUCT_STATUS_LABELS) as [string, string][];

type Tab = "content" | "en" | "seo";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "content", label: "Контент", icon: <Layers size={14} /> },
  { id: "en", label: "English", icon: <Globe size={14} /> },
  { id: "seo", label: "SEO", icon: <Search size={14} /> },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function getInitialPriority(initialData?: Partial<Product>) {
  const candidate = Number((initialData as { priority?: number } | undefined)?.priority);
  if (Number.isFinite(candidate) && candidate >= 1 && candidate <= 10) return candidate;
  const fallback = Number(initialData?.sort_order);
  if (Number.isFinite(fallback) && fallback >= 1 && fallback <= 10) return fallback;
  return 5;
}

// ─── Shared form primitives ───────────────────────────────────────────────────
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
        <div
          className={cn("h-0.5 rounded-full transition-all", warn ? "bg-amber-400" : "bg-emerald-400")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("text-[10px] tabular-nums", warn ? "text-amber-500" : "text-zinc-400")}>{value}/{max}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ProductFormPopup({
  open,
  onClose,
  formulas,
  allStyles,
  allMaterials,
  allCategories,
  initialData,
}: Props) {
  const router = useRouter();
  const { generate, loading: aiLoading } = useAiSeoAssist();
  const isEdit = Boolean(initialData?.id);

  const [activeTab, setActiveTab] = useState<Tab>("content");

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManual, setSlugManual] = useState(Boolean(initialData?.id));
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [shortDescription, setShortDescription] = useState(initialData?.short_description ?? "");
  const [category, setCategory] = useState<string>(initialData?.category ?? "doors");
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
  const [saving, setSaving] = useState(false);

  const hasEnTranslation = !!(titleEn || descriptionEn);
  const hasSeo = !!(seoTitle || seoDescription);

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    if (!slugManual) setSlug(slugify(nextTitle));
  };


  const onModel3dUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isSupportedProductModelFileName(file.name)) {
      toast.error("Тільки .glb файли");
      event.target.value = "";
      return;
    }
    if (file.size > PRODUCT_MODEL_MAX_SIZE_BYTES) {
      toast.error("Файл завеликий. Максимум 50MB.");
      event.target.value = "";
      return;
    }
    try {
      const supabase = createSupabaseBrowserClient();
      const path = buildProductModelPath(file.name);
      const uploadFile =
        file.type === PRODUCT_MODEL_CONTENT_TYPE
          ? file
          : new File([file], file.name, { type: PRODUCT_MODEL_CONTENT_TYPE, lastModified: file.lastModified });

      const { error } = await supabase.storage.from(PRODUCT_MODEL_BUCKET).upload(path, uploadFile, {
        contentType: PRODUCT_MODEL_CONTENT_TYPE,
        upsert: false,
      });
      if (error) { toast.error("Помилка: " + error.message); return; }
      const { data } = supabase.storage.from(PRODUCT_MODEL_BUCKET).getPublicUrl(path);
      setModel3dUrl(data.publicUrl);
      toast.success("3D-модель завантажено");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не вдалося завантажити");
    } finally {
      event.target.value = "";
    }
  };

  const handleAiGenerate = async () => {
    const result = await generate({ title, description, category });
    if (!result) return;
    setSeoTitle(result.seoTitle);
    setSeoDescription(result.seoDescription);
    if (!slugManual && result.slug) setSlug(result.slug);
    setActiveTab("seo");
    toast.success("AI згенерував SEO-поля та slug");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const resolvedCoverImage = coverImage || images[0] || initialData?.cover_image || "";

    const formData = new FormData();
    if (isEdit && initialData?.id) formData.set("id", initialData.id);
    formData.set("title", title.trim());
    formData.set("slug", slug.trim());
    formData.set("description", description.trim());
    formData.set("short_description", shortDescription.trim());
    formData.set("category", category);
    formData.set("materials", materials.join(","));
    formData.set("style", styles.join(","));
    formData.set("status", status);
    formData.set("priority", String(priority));
    formData.set("sort_order", sortOrder.trim() || "0");
    formData.set("is_featured", isFeatured ? "true" : "false");
    formData.set("cover_image", resolvedCoverImage);
    formData.set("model_3d_url", model3dUrl);
    formData.set("images", images.join(","));
    if (priceFrom) formData.set("price_from", priceFrom);
    if (formulaId) formData.set("formula_id", formulaId);
    if (seoTitle.trim()) formData.set("seo_title", seoTitle.trim());
    if (seoDescription.trim()) formData.set("seo_description", seoDescription.trim());
    formData.set("title_en", titleEn.trim());
    formData.set("description_en", descriptionEn.trim());
    formData.set("short_description_en", shortDescriptionEn.trim());
    formData.set("seo_title_en", seoTitleEn.trim());
    formData.set("seo_description_en", seoDescriptionEn.trim());

    const result = await upsertProductAction(formData);
    if (!result.ok) { toast.error(result.message); setSaving(false); return; }

    toast.success(result.message);
    router.refresh();
    onClose();
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 pt-6"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl bg-[#f8f7f5] shadow-2xl ring-1 ring-black/10"
          >
            <form onSubmit={handleSubmit}>

              {/* ── Header ── */}
              <div className="flex items-center justify-between border-b border-zinc-200/80 bg-white px-6 py-4">
                <div>
                  <h2 className="font-[Cormorant,serif] text-xl font-bold text-zinc-900">
                    {isEdit ? "Редагувати продукт" : "Новий продукт"}
                  </h2>
                  {isEdit && initialData?.title && (
                    <p className="mt-0.5 text-xs text-zinc-400">{initialData.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Status badge */}
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                    status === "active" ? "bg-emerald-100 text-emerald-700"
                      : status === "archived" ? "bg-zinc-100 text-zinc-500"
                      : "bg-amber-100 text-amber-700",
                  )}>
                    {PRODUCT_STATUS_LABELS[status as keyof typeof PRODUCT_STATUS_LABELS] ?? status}
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* ── Body ── */}
              <div className="grid max-h-[80vh] overflow-hidden lg:grid-cols-[1fr_280px]">

                {/* ── Left: tabs + content ── */}
                <div className="flex flex-col overflow-hidden border-r border-zinc-200/80">

                  {/* Tab bar */}
                  <div className="flex items-center gap-1 border-b border-zinc-200/80 bg-white px-4 py-2">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                          activeTab === tab.id
                            ? "bg-[var(--color-primary)] text-white shadow-sm"
                            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800",
                        )}
                      >
                        {tab.icon}
                        {tab.label}
                        {tab.id === "en" && hasEnTranslation && (
                          <span className={cn(
                            "rounded-full px-1 py-0.5 text-[9px] font-bold",
                            activeTab === "en" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700",
                          )}>✓</span>
                        )}
                        {tab.id === "seo" && hasSeo && (
                          <span className={cn(
                            "rounded-full px-1 py-0.5 text-[9px] font-bold",
                            activeTab === "seo" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600",
                          )}>✓</span>
                        )}
                      </button>
                    ))}

                    <div className="ml-auto">
                      <button
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={aiLoading || (!title && !description)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                          aiLoading || (!title && !description)
                            ? "cursor-not-allowed text-zinc-300"
                            : "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm hover:opacity-90 hover:shadow-md",
                        )}
                      >
                        {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
                        AI SEO + slug
                      </button>
                    </div>
                  </div>

                  {/* Tab content */}
                  <div className="flex-1 overflow-y-auto">

                    {/* ── Контент tab ── */}
                    {activeTab === "content" && (
                      <div className="space-y-5 p-5">

                        {/* Title */}
                        <div>
                          <FieldLabel required>Назва</FieldLabel>
                          <input
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            required
                            placeholder="Назва продукту"
                            className={cn(
                              "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 font-[Cormorant,serif] text-2xl font-bold text-zinc-900 outline-none transition-all",
                              "placeholder:text-zinc-300 focus:border-[var(--color-primary-300)] focus:ring-2 focus:ring-[var(--color-primary-100)]",
                            )}
                          />
                        </div>

                        {/* Slug */}
                        <div>
                          <div className="mb-1.5 flex items-center justify-between">
                            <FieldLabel>Slug / URL</FieldLabel>
                            {slugManual && (
                              <button
                                type="button"
                                onClick={() => { setSlugManual(false); setSlug(slugify(title)); }}
                                className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-primary)] hover:underline"
                              >
                                <RefreshCw size={9} /> Авто з назви
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 transition-all focus-within:border-[var(--color-primary-300)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--color-primary-100)]">
                            <Link2 size={12} className="shrink-0 text-zinc-300" />
                            <span className="text-xs text-zinc-400">/products/</span>
                            <input
                              value={slug}
                              onChange={(e) => { setSlugManual(true); setSlug(slugify(e.target.value)); }}
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
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={4}
                            placeholder="Детальний опис продукту — характеристики, особливості, переваги…"
                          />
                        </div>

                        {/* Short description */}
                        <div>
                          <FieldLabel>Короткий опис</FieldLabel>
                          <FormTextarea
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value)}
                            rows={2}
                            placeholder="Для карток та попереднього перегляду"
                          />
                        </div>

                        {/* Attributes */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TagInput
                            value={styles}
                            onChange={setStyles}
                            suggestions={allStyles}
                            label="Стилі"
                            placeholder="Додати стиль..."
                          />
                          <TagInput
                            value={materials}
                            onChange={setMaterials}
                            suggestions={allMaterials}
                            label="Матеріали"
                            placeholder="Додати матеріал..."
                          />
                        </div>
                      </div>
                    )}

                    {/* ── EN tab ── */}
                    {activeTab === "en" && (
                      <div className="space-y-5 p-5">
                        <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Globe size={14} className="text-indigo-400" />
                            <p className="text-xs font-semibold text-indigo-700">🇬🇧 Переклад для англомовних користувачів</p>
                          </div>
                          {isEdit && initialData?.id && (
                            <TranslateButton
                              table="products"
                              id={initialData.id}
                              fields={{
                                title,
                                description,
                                short_description: shortDescription,
                                seo_title: seoTitle,
                                seo_description: seoDescription,
                              }}
                              onSuccess={(t) => {
                                if (t.title_en) setTitleEn(t.title_en);
                                if (t.description_en) setDescriptionEn(t.description_en);
                                if (t.short_description_en) setShortDescriptionEn(t.short_description_en);
                                if (t.seo_title_en) setSeoTitleEn(t.seo_title_en);
                                if (t.seo_description_en) setSeoDescriptionEn(t.seo_description_en);
                              }}
                            />
                          )}
                        </div>

                        <div>
                          <FieldLabel>Назва (EN)</FieldLabel>
                          <FormInput
                            value={titleEn}
                            onChange={(e) => setTitleEn(e.target.value)}
                            placeholder="Product name in English"
                          />
                        </div>

                        <div>
                          <FieldLabel>Опис (EN)</FieldLabel>
                          <FormTextarea
                            value={descriptionEn}
                            onChange={(e) => setDescriptionEn(e.target.value)}
                            rows={4}
                            placeholder="Full description in English"
                          />
                        </div>

                        <div>
                          <FieldLabel>Короткий опис (EN)</FieldLabel>
                          <FormTextarea
                            value={shortDescriptionEn}
                            onChange={(e) => setShortDescriptionEn(e.target.value)}
                            rows={2}
                            placeholder="Short description in English"
                          />
                        </div>

                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">SEO (EN)</p>
                          <div>
                            <FieldLabel>SEO Title EN</FieldLabel>
                            <FormInput
                              value={seoTitleEn}
                              onChange={(e) => setSeoTitleEn(e.target.value)}
                              maxLength={60}
                              placeholder="SEO title in English..."
                            />
                            <CharBar value={seoTitleEn.length} max={60} warnAt={50} />
                          </div>
                          <div>
                            <FieldLabel>SEO Description EN</FieldLabel>
                            <FormTextarea
                              value={seoDescriptionEn}
                              onChange={(e) => setSeoDescriptionEn(e.target.value)}
                              rows={2}
                              maxLength={160}
                              placeholder="SEO description in English..."
                            />
                            <CharBar value={seoDescriptionEn.length} max={160} warnAt={140} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── SEO tab ── */}
                    {activeTab === "seo" && (
                      <div className="space-y-5 p-5">
                        <button
                          type="button"
                          onClick={handleAiGenerate}
                          disabled={aiLoading || (!title && !description)}
                          className={cn(
                            "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-sm transition-all",
                            aiLoading || (!title && !description)
                              ? "cursor-not-allowed bg-zinc-100 text-zinc-300"
                              : "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-90 hover:shadow-md",
                          )}
                        >
                          {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                          Згенерувати SEO з AI
                        </button>

                        <div>
                          <FieldLabel>SEO Title</FieldLabel>
                          <FormInput
                            value={seoTitle}
                            onChange={(e) => setSeoTitle(e.target.value)}
                            maxLength={60}
                            placeholder="Заголовок для пошуку..."
                          />
                          <CharBar value={seoTitle.length} max={60} warnAt={50} />
                        </div>

                        <div>
                          <FieldLabel>SEO Description</FieldLabel>
                          <FormTextarea
                            value={seoDescription}
                            onChange={(e) => setSeoDescription(e.target.value)}
                            rows={3}
                            maxLength={160}
                            placeholder="Короткий опис для пошуку..."
                          />
                          <CharBar value={seoDescription.length} max={160} warnAt={140} />
                        </div>

                        {/* SERP preview */}
                        {(seoTitle || title) && (
                          <div className="rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Прев'ю в Google</p>
                            <div className="text-[11px] text-emerald-700">svitlytsya-maystra.com/products/{slug || "..."}</div>
                            <div className="mt-0.5 text-sm font-medium text-blue-700 hover:underline line-clamp-1">
                              {(seoTitle || title).slice(0, 60)}
                            </div>
                            <div className="mt-0.5 text-xs text-zinc-500 line-clamp-2">
                              {(seoDescription || shortDescription || description).slice(0, 160)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Right: sidebar ── */}
                <div className="overflow-y-auto bg-[#f8f7f5] p-4 space-y-4">

                  {/* Photos */}
                  <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
                    <div className="border-b border-zinc-100 px-4 py-2.5">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                        <ImageIcon size={11} /> Фотографії
                      </p>
                    </div>
                    <div className="p-3">
                      <PhotoUploadPopup
                        folder="products"
                        bucket="product-images"
                        images={images}
                        coverImage={coverImage}
                        onImagesChange={(nextImages, nextCover) => {
                          setImages(nextImages);
                          setCoverImage(nextCover);
                        }}
                      />
                    </div>
                  </div>

                  {/* 3D Model */}
                  <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
                    <div className="border-b border-zinc-100 px-4 py-2.5">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                        <Box size={11} /> 3D-модель
                      </p>
                    </div>
                    <div className="p-3">
                      {model3dUrl ? (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                          <Check size={13} className="text-emerald-500" />
                          <span className="flex-1 truncate text-xs font-medium text-emerald-700">Модель завантажена</span>
                          <button type="button" onClick={() => setModel3dUrl("")} className="text-[10px] text-rose-500 hover:underline">
                            Видалити
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 px-3 py-4 text-xs text-zinc-400 transition-all hover:border-zinc-300 hover:bg-zinc-50">
                          <Box size={14} />
                          Завантажити .glb файл
                          <input type="file" accept=".glb" onChange={onModel3dUpload} className="hidden" />
                        </label>
                      )}
                      <p className="mt-2 text-[10px] leading-relaxed text-zinc-400">
                        Формат: .glb без зовнішніх залежностей. До 5MB для швидкого завантаження.
                      </p>
                      <input type="hidden" name="model_3d_url" value={model3dUrl} />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
                    <div className="border-b border-zinc-100 px-4 py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Категорія</p>
                    </div>
                    <div className="p-3">
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="напр. Двері, Меблі…"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 outline-none transition-all focus:border-[var(--color-primary-300)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-100)]"
                      />
                    </div>
                  </div>

                  {/* Status + Featured */}
                  <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
                    <div className="border-b border-zinc-100 px-4 py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Статус</p>
                    </div>
                    <div className="space-y-3 p-3">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as Product["status"])}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 outline-none transition-all focus:border-[var(--color-primary-300)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-100)]"
                      >
                        {STATUSES.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>

                      <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 transition-all hover:bg-zinc-100">
                        <div className="flex items-center gap-2">
                          <Star size={13} className={isFeatured ? "text-amber-500" : "text-zinc-300"} />
                          <span className="text-sm font-medium text-zinc-700">Рекомендований</span>
                        </div>
                        <div
                          onClick={() => setIsFeatured(!isFeatured)}
                          className={cn(
                            "relative h-5 w-9 rounded-full transition-all duration-200 shadow-inner",
                            isFeatured ? "bg-amber-400" : "bg-zinc-200",
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200",
                            isFeatured ? "left-4" : "left-0.5",
                          )} />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
                    <div className="border-b border-zinc-100 px-4 py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Пріоритет</p>
                    </div>
                    <div className="p-3">
                      <PriorityBar value={priority} onChange={setPriority} label="" />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
                    <div className="border-b border-zinc-100 px-4 py-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Ціноутворення</p>
                    </div>
                    <div className="space-y-3 p-3">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Ціна від (грн)</label>
                        <FormInput
                          type="number"
                          min="0"
                          value={priceFrom}
                          onChange={(e) => setPriceFrom(e.target.value)}
                          placeholder="Необов'язково"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Формула</label>
                        <FormulaPicker formulas={formulas} value={formulaId} onChange={setFormulaId} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Порядок сортування</label>
                        <FormInput
                          type="number"
                          min="0"
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ── Footer ── */}
              <div className="flex items-center justify-end gap-2 border-t border-zinc-200/80 bg-white px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-all hover:bg-zinc-50 hover:shadow-sm"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[var(--color-primary-700)] hover:shadow-md disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                  {saving ? "Збереження…" : isEdit ? "Зберегти зміни" : "Створити продукт"}
                </button>
              </div>

            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
