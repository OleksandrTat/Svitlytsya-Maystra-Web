"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { upsertProductAction } from "@/actions/admin/products";
import { FormulaPicker } from "@/components/admin/shared/formula-picker";
import { PhotoUploadPopup } from "@/components/admin/shared/photo-upload-popup";
import { PriorityBar } from "@/components/admin/shared/priority-bar";
import { TagInput } from "@/components/admin/shared/tag-input";
import { useAiSeoAssist } from "@/hooks/use-ai-seo-assist";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import type { PriceFormula, Product } from "@/lib/types";

type ProductAttribute = {
  value: string;
  usage_count: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  formulas: PriceFormula[];
  styleAttributes: Record<string, ProductAttribute[]>;
  materialAttributes: Record<string, ProductAttribute[]>;
  initialData?: Partial<Product>;
  projects?: { id: string; title: string }[];
  initialProjectId?: string;
};

const CATEGORIES = Object.entries(PRODUCT_CATEGORY_LABELS) as [string, string][];
const STATUSES = Object.entries(PRODUCT_STATUS_LABELS) as [string, string][];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function getInitialPriority(initialData?: Partial<Product>) {
  const candidate = Number((initialData as { priority?: number } | undefined)?.priority);
  if (Number.isFinite(candidate) && candidate >= 1 && candidate <= 10) {
    return candidate;
  }

  const fallback = Number(initialData?.sort_order);
  if (Number.isFinite(fallback) && fallback >= 1 && fallback <= 10) {
    return fallback;
  }

  return 5;
}

export function ProductFormPopup({
  open,
  onClose,
  formulas,
  styleAttributes,
  materialAttributes,
  initialData,
  projects = [],
  initialProjectId,
}: Props) {
  const router = useRouter();
  const { generate, loading: aiLoading, error: aiError } = useAiSeoAssist();
  const isEdit = Boolean(initialData?.id);

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
  const [priceFrom, setPriceFrom] = useState(initialData?.price_from?.toString() ?? "");
  const [formulaId, setFormulaId] = useState(initialData?.formula_id ?? "");
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false);
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description ?? "");
  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
  const [coverImage, setCoverImage] = useState(initialData?.cover_image ?? "");
  const [linkedProjectId, setLinkedProjectId] = useState(initialProjectId ?? "");
  const [saving, setSaving] = useState(false);

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    if (!slugManual) {
      setSlug(slugify(nextTitle));
    }
  };

  const categoryStyles = (styleAttributes[category] ?? []).map((item) => item.value);
  const categoryMaterials = (materialAttributes[category] ?? []).map((item) => item.value);

  const handleAiGenerate = async () => {
    const result = await generate({ title, description, category });
    if (!result) {
      return;
    }

    setSeoTitle(result.seoTitle);
    setSeoDescription(result.seoDescription);
    if (!slugManual && result.slug) {
      setSlug(result.slug);
    }
    toast.success("AI згенерував SEO поля та slug.");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const resolvedCoverImage = coverImage || images[0] || initialData?.cover_image || "";

    const formData = new FormData();
    if (isEdit && initialData?.id) {
      formData.set("id", initialData.id);
    }
    formData.set("title", title.trim());
    formData.set("slug", slug.trim());
    formData.set("description", description.trim());
    formData.set("short_description", shortDescription.trim());
    formData.set("category", category);
    formData.set("materials", materials.join(","));
    formData.set("style", styles.join(","));
    formData.set("status", status);
    formData.set("priority", String(priority));
    formData.set("sort_order", String(priority));
    formData.set("is_featured", isFeatured ? "true" : "false");
    formData.set("cover_image", resolvedCoverImage);
    formData.set("images", images.join(","));
    if (priceFrom) {
      formData.set("price_from", priceFrom);
    }
    if (formulaId) {
      formData.set("formula_id", formulaId);
    }
    if (seoTitle.trim()) {
      formData.set("seo_title", seoTitle.trim());
    }
    if (seoDescription.trim()) {
      formData.set("seo_description", seoDescription.trim());
    }
    if (linkedProjectId) {
      formData.set("project_id", linkedProjectId);
    }

    const result = await upsertProductAction(formData);
    if (!result.ok) {
      toast.error(result.message);
      setSaving(false);
      return;
    }

    toast.success(result.message);
    router.refresh();
    onClose();
    setSaving(false);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 pt-8"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl"
          >
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
                <h2 className="font-display text-xl text-[var(--color-text-primary)]">
                  {isEdit ? "Редагувати продукт" : "Новий продукт"}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 hover:bg-[var(--color-surface)]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[78vh] overflow-y-auto">
                <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
                  <div className="space-y-4 border-r border-[var(--color-border)] p-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Назва *
                        </label>
                        <button
                          type="button"
                          onClick={handleAiGenerate}
                          disabled={aiLoading || (!title && !description)}
                          className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2 py-1 text-[10px] font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary-100)] disabled:opacity-40"
                        >
                          <Sparkles size={11} />
                          {aiLoading ? "AI..." : "AI SEO + slug"}
                        </button>
                      </div>

                      <input
                        value={title}
                        onChange={(event) => handleTitleChange(event.target.value)}
                        required
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                        placeholder="Назва продукту"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Slug
                        </label>
                        {slugManual ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSlugManual(false);
                              setSlug(slugify(title));
                            }}
                            className="text-[10px] text-[var(--color-primary)] underline"
                          >
                            Синхронізувати
                          </button>
                        ) : null}
                      </div>

                      <input
                        value={slug}
                        onChange={(event) => {
                          setSlugManual(true);
                          setSlug(slugify(event.target.value));
                        }}
                        required
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 font-mono text-sm"
                      />
                      <p className="text-[10px] text-[var(--color-text-secondary)]">
                        /products/{slug || "..."}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                        Повний опис *
                      </label>
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        required
                        rows={3}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                        placeholder="Детальний опис продукту"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                        Короткий опис
                      </label>
                      <textarea
                        value={shortDescription}
                        onChange={(event) => setShortDescription(event.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                        placeholder="Для карток та попереднього перегляду"
                      />
                    </div>

                    <TagInput
                      value={styles}
                      onChange={setStyles}
                      suggestions={categoryStyles}
                      label="Стилі"
                      placeholder="Додати стиль..."
                    />

                    <TagInput
                      value={materials}
                      onChange={setMaterials}
                      suggestions={categoryMaterials}
                      label="Матеріали"
                      placeholder="Додати матеріал..."
                    />

                    <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                        SEO
                      </p>
                      {aiError ? <p className="text-xs text-red-600">{aiError}</p> : null}

                      <div className="space-y-1.5">
                        <label className="text-xs text-[var(--color-text-secondary)]">
                          SEO Title{" "}
                          <span className={seoTitle.length > 60 ? "text-amber-600" : ""}>
                            {seoTitle.length}/60
                          </span>
                        </label>
                        <input
                          value={seoTitle}
                          onChange={(event) => setSeoTitle(event.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-[var(--color-text-secondary)]">
                          SEO Description{" "}
                          <span className={seoDescription.length > 160 ? "text-amber-600" : ""}>
                            {seoDescription.length}/160
                          </span>
                        </label>
                        <textarea
                          value={seoDescription}
                          onChange={(event) => setSeoDescription(event.target.value)}
                          rows={2}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                        Фотографії
                      </p>
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

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                        Категорія *
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CATEGORIES.map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setCategory(value)}
                            className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                              category === value
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-500)]"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                        Статус
                      </label>
                      <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as Product["status"])}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                      >
                        {STATUSES.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <PriorityBar value={priority} onChange={setPriority} label="Пріоритет" />

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                        Ціна від (грн)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={priceFrom}
                        onChange={(event) => setPriceFrom(event.target.value)}
                        placeholder="Залиште порожнім - ціна за запитом"
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                        Формула розрахунку
                      </label>
                      <FormulaPicker formulas={formulas} value={formulaId} onChange={setFormulaId} />
                    </div>

                    {projects.length > 0 ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Додати у проєкт
                        </label>
                        <select
                          value={linkedProjectId}
                          onChange={(event) => setLinkedProjectId(event.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                        >
                          <option value="">Не додавати</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(event) => setIsFeatured(event.target.checked)}
                      />
                      Рекомендований
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving
                    ? "Збереження..."
                    : isEdit
                      ? "Зберегти зміни"
                      : "Створити продукт"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
