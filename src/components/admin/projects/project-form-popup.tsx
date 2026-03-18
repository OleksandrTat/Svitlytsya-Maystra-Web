"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { upsertProjectAction } from "@/actions/admin";
import { ClientSearchInput } from "@/components/admin/shared/client-search-input";
import { PhotoUploadPopup } from "@/components/admin/shared/photo-upload-popup";
import { TagInput } from "@/components/admin/shared/tag-input";
import { useAiSeoAssist } from "@/hooks/use-ai-seo-assist";
import { PROJECT_CATEGORY_LABELS } from "@/lib/constants";
import type { ClientSummary } from "@/lib/data/queries";
import type { Product, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  clients: ClientSummary[];
  availableProducts: Product[];
  initialData?: Partial<Project>;
  initialLinkedProductIds?: string[];
};

const CATEGORIES = Object.entries(PROJECT_CATEGORY_LABELS) as [string, string][];
const STATUSES = [
  { value: "public", label: "Публічний" },
  { value: "concept", label: "Концепт" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProjectFormPopup({
  open,
  onClose,
  clients,
  availableProducts,
  initialData,
  initialLinkedProductIds = [],
}: Props) {
  const router = useRouter();
  const { generate, loading: aiLoading, error: aiError } = useAiSeoAssist();
  const isEdit = Boolean(initialData?.id);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugManual, setSlugManual] = useState(Boolean(initialData?.id));
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [styles, setStyles] = useState<string[]>(initialData?.style ?? []);
  const [materials, setMaterials] = useState<string[]>(initialData?.materials ?? []);
  const [category, setCategory] = useState<string>(initialData?.category ?? "doors");
  const [status, setStatus] = useState(initialData?.status === "concept" ? "concept" : "public");
  const [isNonPublic, setIsNonPublic] = useState(
    initialData?.status === "nda" || (initialData?.privacy_level ?? "public") !== "public",
  );
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false);
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [completedAt, setCompletedAt] = useState(initialData?.completed_at ?? "");
  const [durationDays, setDurationDays] = useState(initialData?.duration_days?.toString() ?? "");
  const [dimensions, setDimensions] = useState(initialData?.dimensions ?? "");
  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
  const [coverImage, setCoverImage] = useState(initialData?.cover_image ?? "");
  const [clientId, setClientId] = useState("");
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description ?? "");
  const privateClientName = initialData?.private_client_name ?? "";
  const privateLocation = initialData?.private_location ?? "";
  const privateNotes = initialData?.private_notes ?? "";
  const [linkedProductIds, setLinkedProductIds] = useState<string[]>(initialLinkedProductIds);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productsPanelOpen, setProductsPanelOpen] = useState(
    initialLinkedProductIds.length > 0,
  );
  const [saving, setSaving] = useState(false);

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    if (!slugManual) {
      setSlug(slugify(nextTitle));
    }
  };

  const filteredProducts = availableProducts.filter((product) => {
    const normalizedQuery = productSearchQuery.toLowerCase();
    return (
      product.status === "active" &&
      (product.title.toLowerCase().includes(normalizedQuery) ||
        product.category.includes(normalizedQuery))
    );
  });

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
    toast.success("AI згенерував SEO та slug.");
  };

  const toggleProduct = (id: string) => {
    setLinkedProductIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const resolvedCoverImage = coverImage || images[0] || initialData?.cover_image || "";

    const selectedClient = clientId ? clients.find((client) => client.id === clientId) : null;

    if (!resolvedCoverImage) {
      toast.error("Додайте хоча б одне фото для обкладинки проєкту.");
      setSaving(false);
      return;
    }

    const formData = new FormData();
    if (isEdit && initialData?.id) {
      formData.set("id", initialData.id);
    }
    formData.set("title", title.trim());
    formData.set("slug", slug.trim());
    formData.set("description", description.trim());
    formData.set("category", category);
    formData.set("style", styles.join(","));
    formData.set("materials", materials.join(","));
    formData.set("status", isNonPublic ? "nda" : status === "concept" ? "concept" : "public");
    formData.set("privacy_level", isNonPublic ? "nda_full" : "public");
    formData.set("is_featured", isFeatured ? "on" : "false");
    formData.set("cover_image", resolvedCoverImage);
    formData.set("images", images.join(","));
    formData.set("blurred_images", "");
    formData.set("product_ids", linkedProductIds.join(","));
    if (location.trim()) {
      formData.set("location", location.trim());
    }
    if (completedAt) {
      formData.set("completed_at", completedAt);
    }
    if (durationDays) {
      formData.set("duration_days", durationDays);
    }
    if (dimensions.trim()) {
      formData.set("dimensions", dimensions.trim());
    }
    if (selectedClient?.display_name?.trim()) {
      formData.set("private_client_name", selectedClient.display_name.trim());
    } else if (privateClientName.trim()) {
      formData.set("private_client_name", privateClientName.trim());
    }
    if (privateLocation.trim()) {
      formData.set("private_location", privateLocation.trim());
    }
    if (privateNotes.trim()) {
      formData.set("private_notes", privateNotes.trim());
    }
    if (seoTitle.trim()) {
      formData.set("seo_title", seoTitle.trim());
    }
    if (seoDescription.trim()) {
      formData.set("seo_description", seoDescription.trim());
    }

    const result = await upsertProjectAction(formData);
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
                  {isEdit ? "Редагувати проєкт" : "Новий проєкт"}
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
                          Назва проєкту *
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
                        placeholder="Назва проєкту"
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
                        /catalog/{slug || "..."}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                        Опис *
                      </label>
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        required
                        rows={3}
                        className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                        placeholder="Опис проєкту для каталогу"
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <TagInput
                        value={styles}
                        onChange={setStyles}
                        label="Стилі"
                        placeholder="Додати стиль..."
                      />
                      <TagInput
                        value={materials}
                        onChange={setMaterials}
                        label="Матеріали"
                        placeholder="Додати матеріал..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-[var(--color-text-secondary)]">
                          Локація
                        </label>
                        <input
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                          placeholder="Київ, Україна"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-[var(--color-text-secondary)]">
                          Розміри
                        </label>
                        <input
                          value={dimensions}
                          onChange={(event) => setDimensions(event.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                          placeholder="2100x900 мм"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-[var(--color-text-secondary)]">
                          Дата завершення
                        </label>
                        <input
                          type="date"
                          value={completedAt}
                          onChange={(event) => setCompletedAt(event.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-[var(--color-text-secondary)]">
                          Термін (днів)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={durationDays}
                          onChange={(event) => setDurationDays(event.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
                      <button
                        type="button"
                        onClick={() => setProductsPanelOpen((current) => !current)}
                        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
                      >
                        <span>Продукти у проєкті ({linkedProductIds.length})</span>
                        {productsPanelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {productsPanelOpen ? (
                        <div className="border-t border-[var(--color-border)]">
                          <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
                            <Search size={13} className="text-[var(--color-text-secondary)]" />
                            <input
                              value={productSearchQuery}
                              onChange={(event) => setProductSearchQuery(event.target.value)}
                              placeholder="Пошук продуктів..."
                              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
                            />
                          </div>

                          <div className="max-h-40 space-y-1 overflow-y-auto p-2">
                            {filteredProducts.length === 0 ? (
                              <p className="py-3 text-center text-xs text-[var(--color-text-secondary)]">
                                Немає доступних продуктів
                              </p>
                            ) : null}

                            {filteredProducts.map((product) => {
                              const linked = linkedProductIds.includes(product.id);
                              return (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => toggleProduct(product.id)}
                                  className={cn(
                                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition",
                                    linked
                                      ? "bg-[var(--color-primary-100)] text-[var(--color-primary)]"
                                      : "hover:bg-[var(--color-surface)]",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                                      linked
                                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                                        : "border-[var(--color-border)]",
                                    )}
                                  >
                                    {linked ? <Check size={10} className="text-white" /> : null}
                                  </div>
                                  <span className="truncate">{product.title}</span>
                                  <span className="ml-auto shrink-0 text-[10px] text-[var(--color-text-secondary)]">
                                    {product.category}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>

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
                        folder="projects"
                        bucket="project-images"
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
                      <div className="grid grid-cols-1 gap-1.5">
                        {CATEGORIES.map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setCategory(value)}
                            className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
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

                    <div className="space-y-2 rounded-xl border border-[var(--color-border)] p-3">
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={isNonPublic}
                          onChange={(event) => setIsNonPublic(event.target.checked)}
                        />
                        Непублічний (NDA)
                      </label>
                      {isNonPublic ? (
                        <p className="rounded-lg bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
                          Проєкт не буде відображатись у публічному каталозі.
                        </p>
                      ) : null}
                    </div>

                    {!isNonPublic ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Статус
                        </label>
                        <select
                          value={status}
                          onChange={(event) => setStatus(event.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                        >
                          {STATUSES.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                        Клієнт
                      </label>
                      <ClientSearchInput
                        clients={clients}
                        value={clientId}
                        onChange={setClientId}
                        placeholder="Знайти клієнта..."
                      />
                      {isNonPublic && !clientId && !privateClientName ? (
                        <p className="text-[10px] text-[var(--color-text-secondary)]">
                          Для NDA-проєкту рекомендується вказати клієнта.
                        </p>
                      ) : null}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(event) => setIsFeatured(event.target.checked)}
                      />
                      Показувати на головній
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
                      : "Створити проєкт"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
