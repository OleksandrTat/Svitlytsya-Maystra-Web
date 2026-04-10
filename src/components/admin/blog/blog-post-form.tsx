"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  Eye,
  Globe,
  ImagePlus,
  Loader2,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Star,
  Trash2,
  User,
  X,
  Languages,
  BookOpen,
  Settings,
  Search,
  Zap,
  Link2,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { BlogEditor } from "./blog-editor";
import { CategoryCombobox, type CategoryLabels } from "@/components/admin/shared/category-combobox";
import { TagInput } from "@/components/admin/shared/tag-input";
import {
  upsertBlogPostAction,
  deleteBlogPostAction,
  generateBlogSlugAction,
} from "@/actions/admin/blog";
import { useAiSeoAssist } from "@/hooks/use-ai-seo-assist";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BlogPost, Service, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  initialData?: BlogPost | null;
  services: Pick<Service, "id" | "title">[];
  products: Pick<Product, "id" | "title">[];
  allCategories?: string[];
  categoryLabels?: CategoryLabels;
  allTags?: string[];
  tagTranslations?: Record<string, string>;
};

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 group">
      <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-all duration-200 shadow-inner",
          checked ? "bg-[var(--color-primary)]" : "bg-zinc-200",
        )}
      >
        <div className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200",
          checked ? "left-4" : "left-0.5",
        )} />
      </div>
    </label>
  );
}

// ─── AI translate helper ───────────────────────────────────────────────────────
async function aiTranslateTexts(texts: string[]): Promise<string[] | null> {
  try {
    const res = await fetch("/api/admin/translate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });
    const data = (await res.json()) as { translations?: string[]; error?: string };
    if (!res.ok || !data.translations) return null;
    return data.translations;
  } catch {
    return null;
  }
}

// ─── Field label with translate button ───────────────────────────────────────
function FieldLabel({
  label,
  onTranslate,
  translating,
  hasValue,
}: {
  label: string;
  onTranslate?: () => void;
  translating?: boolean;
  hasValue?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{label}</label>
      {onTranslate && (
        <button
          type="button"
          onClick={onTranslate}
          disabled={translating || !hasValue}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all",
            hasValue
              ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:shadow-sm"
              : "cursor-not-allowed text-zinc-300",
          )}
        >
          {translating ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
          Перекласти
        </button>
      )}
    </div>
  );
}

// ─── Google SERP preview ──────────────────────────────────────────────────────
function SerpPreview({ title, description, slug }: { title: string; description: string; slug: string }) {
  const displayTitle = title || "Заголовок статті";
  const displayDesc = description || "Опис статті...";
  const displayUrl = `svitlytsya-maystra.com/blog/${slug || "slug"}`;

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        <Search size={9} /> Прев'ю в Google
      </p>
      <div className="text-[11px] text-emerald-700">{displayUrl}</div>
      <div className="mt-0.5 text-sm font-medium leading-snug text-blue-700 hover:underline">
        {displayTitle.slice(0, 60)}{displayTitle.length > 60 && "..."}
      </div>
      <div className="mt-0.5 text-xs leading-relaxed text-zinc-500 line-clamp-2">
        {displayDesc.slice(0, 160)}{displayDesc.length > 160 && "..."}
      </div>
    </div>
  );
}

// ─── Sidebar card ──────────────────────────────────────────────────────────────
function SideCard({ title, icon, children, defaultOpen = true, accent }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accent?: "blue" | "red";
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn(
      "overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md",
      accent === "red" ? "border-red-200" : "border-zinc-200/80",
    )}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50/80 transition-colors"
      >
        <div className={cn(
          "flex items-center gap-2 text-sm font-semibold",
          accent === "red" ? "text-red-700" : "text-zinc-800",
        )}>
          <span className={cn(accent === "red" ? "text-red-400" : "text-zinc-400")}>{icon}</span>
          {title}
        </div>
        <ChevronDown size={13} className={cn("transition-transform duration-200", open ? "rotate-180 text-zinc-400" : "text-zinc-300")} />
      </button>
      {open && (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────
function SideLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">{children}</label>;
}

// ─── Input ────────────────────────────────────────────────────────────────────
function SideInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
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

// ─── Select ───────────────────────────────────────────────────────────────────
function SideSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 outline-none transition-all appearance-none",
        "focus:border-[var(--color-primary-300)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-100)]",
        className,
      )}
    />
  );
}

// ─── Char counter bar ─────────────────────────────────────────────────────────
function CharBar({ value, max, warnAt }: { value: number; max: number; warnAt: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const warn = value > warnAt;
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={cn("h-0.5 rounded-full transition-all duration-300", warn ? "bg-amber-400" : "bg-emerald-400")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("text-[10px] tabular-nums", warn ? "text-amber-500" : "text-zinc-400")}>{value}/{max}</span>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export function BlogPostForm({ initialData, services, products, allCategories = [], categoryLabels, allTags = [], tagTranslations }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [catLabels, setCatLabels] = useState<CategoryLabels>(categoryLabels ?? {});
  const [tagTransl, setTagTransl] = useState<Record<string, string>>(tagTranslations ?? {});

  // 🇺🇦 Ukrainian fields
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");

  // 🇬🇧 English fields
  const [titleEn, setTitleEn] = useState(initialData?.title_en ?? "");
  const [excerptEn, setExcerptEn] = useState(initialData?.excerpt_en ?? "");
  const [contentEn, setContentEn] = useState(initialData?.content_en ?? "");
  const [seoTitleEn, setSeoTitleEn] = useState(initialData?.seo_title_en ?? "");
  const [seoDescriptionEn, setSeoDescriptionEn] = useState(initialData?.seo_description_en ?? "");

  // Meta
  const [coverImage, setCoverImage] = useState(initialData?.cover_image ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [isPublished, setIsPublished] = useState(initialData?.is_published ?? false);
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false);
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description ?? "");
  const [authorName, setAuthorName] = useState(initialData?.author_name ?? "Команда Світлиці");
  const [authorAvatar, setAuthorAvatar] = useState(initialData?.author_avatar ?? "");
  const [relatedServiceId, setRelatedServiceId] = useState(initialData?.related_service_id ?? "");
  const [relatedProductId, setRelatedProductId] = useState(initialData?.related_product_id ?? "");

  // UI state
  const [activeTab, setActiveTab] = useState<"uk" | "en">("uk");
  const [isDirty, setIsDirty] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Per-field translate loading
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [translatingAll, setTranslatingAll] = useState(false);

  const { generate: generateSeo, loading: seoLoading } = useAiSeoAssist();
  const markDirty = useCallback(() => setIsDirty(true), []);

  const setFieldTranslating = (field: string, val: boolean) =>
    setTranslating((prev) => ({ ...prev, [field]: val }));

  // ── Cover image upload ────────────────────────────────────────────────────
  const onCoverDrop = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `blog/covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("blog-images").upload(path, file, { contentType: file.type });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
      setCoverImage(data.publicUrl);
      markDirty();
      toast.success("Обкладинку завантажено");
    } catch {
      toast.error("Не вдалося завантажити обкладинку");
    } finally {
      setCoverUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onCoverDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  // ── Auto-slug ─────────────────────────────────────────────────────────────
  const handleAutoSlug = async () => {
    if (!title) return;
    const newSlug = await generateBlogSlugAction(title);
    setSlug(newSlug);
    markDirty();
  };

  // ── AI SEO ────────────────────────────────────────────────────────────────
  const handleGenerateSeo = async () => {
    const result = await generateSeo({
      title,
      description: excerpt || content.replace(/<[^>]+>/g, " ").slice(0, 500),
      category,
    });
    if (result) {
      setSeoTitle(result.seoTitle);
      setSeoDescription(result.seoDescription);
      markDirty();
      toast.success("SEO згенеровано");
    }
  };

  // ── Per-field AI translate ────────────────────────────────────────────────
  const translateField = async (
    field: string,
    source: string,
    setter: (v: string) => void,
  ) => {
    if (!source.trim()) return;
    setFieldTranslating(field, true);
    const result = await aiTranslateTexts([source]);
    setFieldTranslating(field, false);
    if (result?.[0]) {
      setter(result[0]);
      setActiveTab("en");
      markDirty();
      toast.success("Переклад готовий");
    } else {
      toast.error("Не вдалося перекласти");
    }
  };

  // ── Translate ALL fields ──────────────────────────────────────────────────
  const handleTranslateAll = async () => {
    const fields = [
      { key: "title", src: title, setter: setTitleEn },
      { key: "excerpt", src: excerpt, setter: setExcerptEn },
      { key: "content", src: content.replace(/<[^>]+>/g, " "), setter: setContentEn },
      { key: "seoTitle", src: seoTitle, setter: setSeoTitleEn },
      { key: "seoDesc", src: seoDescription, setter: setSeoDescriptionEn },
    ].filter((f) => f.src.trim());

    if (!fields.length) { toast.info("Немає тексту для перекладу"); return; }

    setTranslatingAll(true);
    const toasts = toast.loading(`Перекладаю ${fields.length} полів...`);

    const results = await aiTranslateTexts(fields.map((f) => f.src));

    setTranslatingAll(false);
    toast.dismiss(toasts);

    if (!results) { toast.error("Помилка перекладу"); return; }

    fields.forEach((f, i) => {
      if (results[i]) f.setter(results[i]!);
    });

    markDirty();
    setActiveTab("en");
    toast.success(`Перекладено ${fields.length} полів ✓`);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback((publish: boolean) => {
    startTransition(async () => {
      const fd = new FormData();
      if (initialData?.id) fd.set("id", initialData.id);
      fd.set("title", title);
      fd.set("slug", slug);
      fd.set("excerpt", excerpt);
      fd.set("content", content);
      fd.set("cover_image", coverImage);
      fd.set("category", category);
      fd.set("tags", JSON.stringify(tags));
      fd.set("reading_time_min", "0");
      fd.set("is_published", String(publish));
      fd.set("is_featured", String(isFeatured));
      fd.set("seo_title", seoTitle);
      fd.set("seo_description", seoDescription);
      fd.set("author_name", authorName);
      fd.set("author_avatar", authorAvatar);
      fd.set("related_service_id", relatedServiceId);
      fd.set("related_product_id", relatedProductId);
      // EN fields
      if (titleEn) fd.set("title_en", titleEn);
      if (excerptEn) fd.set("excerpt_en", excerptEn);
      if (contentEn) fd.set("content_en", contentEn);
      if (seoTitleEn) fd.set("seo_title_en", seoTitleEn);
      if (seoDescriptionEn) fd.set("seo_description_en", seoDescriptionEn);
      fd.set("category_labels", JSON.stringify(catLabels));
      fd.set("tag_translations", JSON.stringify(tagTransl));

      const result = await upsertBlogPostAction(fd);
      if (result.ok) {
        toast.success(result.message);
        setIsDirty(false);
        setIsPublished(publish);
        setLastSaved(new Date());
        if (!initialData?.id && result.data) {
          router.replace(`/admin/blog/${result.data.id}/edit`);
        }
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, excerpt, content, coverImage, category, tags, isFeatured, seoTitle, seoDescription, authorName, authorAvatar, relatedServiceId, relatedProductId, titleEn, excerptEn, contentEn, seoTitleEn, seoDescriptionEn]);

  // ── Auto-save every 30s ───────────────────────────────────────────────────
  const autoSaveRef = useRef(handleSubmit);
  useEffect(() => { autoSaveRef.current = handleSubmit; }, [handleSubmit]);
  useEffect(() => {
    const id = setInterval(() => {
      if (isDirty && !pending) autoSaveRef.current(isPublished);
    }, 30_000);
    return () => clearInterval(id);
  }, [isDirty, pending, isPublished]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!initialData?.id) return;
    if (!confirm("Видалити цю статтю? Цю дію не можна скасувати.")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", initialData.id);
      const result = await deleteBlogPostAction(fd);
      if (result.ok) {
        toast.success(result.message);
        router.replace("/admin/blog");
      } else {
        toast.error(result.message);
      }
    });
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSubmit(isPublished); }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSubmit(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit, isPublished]);

  // ── Unsaved warning ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [isDirty]);

  const hasEnTranslation = !!(titleEn || excerptEn || contentEn);
  const words = content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f5]">

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-5 py-3">

          {/* Back button */}
          <button
            type="button"
            onClick={() => router.push("/admin/blog")}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowLeft size={15} />
            <span className="hidden sm:inline">Блог</span>
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
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Незбережені зміни
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                <Check size={11} />
                {lastSaved.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : (
              <span className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                isPublished ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500",
              )}>
                <span className={cn("h-1.5 w-1.5 rounded-full", isPublished ? "bg-emerald-400" : "bg-zinc-300")} />
                {isPublished ? "Опубліковано" : "Чернетка"}
              </span>
            )}
            {isFeatured && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                <Star size={9} /> Featured
              </span>
            )}
          </div>

          {/* Reading stats */}
          {words > 0 && (
            <span className="hidden items-center gap-1.5 text-xs text-zinc-400 md:flex">
              <BookOpen size={11} />
              ~{readingTime} хв · {words} слів
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[10px] text-zinc-300 xl:block">⌘S зберегти · ⌘↵ публікувати</span>

            {initialData?.slug && (
              <a
                href={`/blog/${initialData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm"
              >
                <Eye size={13} /> Переглянути
              </a>
            )}
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm disabled:opacity-40"
            >
              <Save size={13} /> Зберегти
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-primary-700)] hover:shadow-md disabled:opacity-40"
            >
              {pending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {isPublished ? "Оновити" : "Опублікувати"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">

          {/* ── Left: editor ── */}
          <div className="space-y-5">

            {/* Cover image */}
            <div className={cn(
              "group overflow-hidden rounded-2xl border-2 transition-all duration-200",
              isDragActive
                ? "border-blue-400 bg-blue-50 shadow-lg"
                : coverImage
                  ? "border-transparent shadow-lg"
                  : "border-dashed border-zinc-300 bg-white hover:border-zinc-400",
            )}>
              {coverImage ? (
                <div className="relative aspect-[21/8]">
                  <Image src={coverImage} alt="" fill className="object-cover" sizes="900px" />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {/* Actions */}
                  <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <label
                      {...getRootProps()}
                      className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-zinc-700 shadow-lg backdrop-blur-sm transition hover:bg-white"
                    >
                      <input {...getInputProps()} />
                      <ImagePlus size={12} /> Змінити
                    </label>
                    <button
                      type="button"
                      onClick={() => { setCoverImage(""); markDirty(); }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/95 text-zinc-700 shadow-lg backdrop-blur-sm transition hover:bg-white hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className="flex aspect-[21/8] cursor-pointer flex-col items-center justify-center gap-4 p-8"
                >
                  <input {...getInputProps()} />
                  {coverUploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={32} className="animate-spin text-[var(--color-primary-300)]" />
                      <p className="text-sm font-medium text-zinc-500">Завантаження…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
                        isDragActive ? "bg-blue-100 text-blue-500" : "bg-zinc-100 text-zinc-400",
                      )}>
                        <ImagePlus size={26} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-600">
                          {isDragActive ? "Відпустіть для завантаження" : "Додати обкладинку"}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-400">Перетягніть або натисніть · JPG / PNG / WEBP до 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language tabs + translate all */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 rounded-xl bg-zinc-100/80 p-1">
                {(["uk", "en"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                      activeTab === tab
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700",
                    )}
                  >
                    {tab === "uk" ? "🇺🇦 Українська" : "🇬🇧 English"}
                    {tab === "en" && hasEnTranslation && (
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        activeTab === "en" ? "bg-emerald-100 text-emerald-700" : "bg-emerald-100 text-emerald-700",
                      )}>✓</span>
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void handleTranslateAll()}
                disabled={translatingAll || (!title && !excerpt && !content)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                  translatingAll || (!title && !excerpt && !content)
                    ? "cursor-not-allowed text-zinc-300"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:shadow-sm",
                )}
              >
                {translatingAll ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Перекласти все
              </button>
            </div>

            {/* ── Content card ── */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">

              {/* Title */}
              <div className="border-b border-zinc-100 px-8 pb-4 pt-6">
                <input
                  type="text"
                  value={activeTab === "uk" ? title : titleEn}
                  onChange={(e) => {
                    if (activeTab === "uk") setTitle(e.target.value);
                    else setTitleEn(e.target.value);
                    markDirty();
                  }}
                  placeholder={activeTab === "uk" ? "Заголовок статті..." : "Article title..."}
                  className="w-full border-0 bg-transparent font-[Cormorant,serif] text-[2.5rem] font-bold leading-tight text-zinc-900 outline-none placeholder:text-zinc-200"
                />

                {/* EN translate button for title */}
                {activeTab === "en" && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => void translateField("title", title, setTitleEn)}
                      disabled={translating.title || !title}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all",
                        title ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" : "cursor-not-allowed text-zinc-300",
                      )}
                    >
                      {translating.title ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                      Перекласти з укр.
                    </button>
                  </div>
                )}

                {/* Slug (only in UK tab) */}
                {activeTab === "uk" && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
                    <Link2 size={12} className="shrink-0 text-zinc-300" />
                    <span className="text-xs text-zinc-400">/blog/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => { setSlug(e.target.value); markDirty(); }}
                      placeholder="slug-url"
                      className="min-w-0 flex-1 bg-transparent text-xs text-zinc-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void handleAutoSlug()}
                      title="Згенерувати зі заголовку"
                      className="rounded-lg p-1 text-zinc-300 transition hover:bg-zinc-200 hover:text-zinc-600"
                    >
                      <RefreshCw size={11} />
                    </button>
                  </div>
                )}
              </div>

              {/* Excerpt */}
              <div className="border-b border-zinc-100 px-8 py-5">
                <FieldLabel
                  label="Анонс"
                  onTranslate={activeTab === "en" ? () => void translateField("excerpt", excerpt, setExcerptEn) : undefined}
                  translating={translating.excerpt}
                  hasValue={!!excerpt}
                />
                <textarea
                  value={activeTab === "uk" ? excerpt : excerptEn}
                  onChange={(e) => {
                    if (activeTab === "uk") setExcerpt(e.target.value);
                    else setExcerptEn(e.target.value);
                    markDirty();
                  }}
                  placeholder={activeTab === "uk" ? "Короткий опис статті, який відображається в списку…" : "Short article description shown in the listing..."}
                  maxLength={300}
                  rows={3}
                  className="w-full resize-none border-0 bg-transparent text-base leading-relaxed text-zinc-600 outline-none placeholder:text-zinc-300"
                />
                <div className="flex items-center justify-end">
                  <span className="text-[10px] text-zinc-300">
                    {activeTab === "uk" ? excerpt.length : excerptEn.length}/300
                  </span>
                </div>
              </div>

              {/* Content editor */}
              <div className="px-8 py-5">
                <FieldLabel
                  label="Контент"
                  onTranslate={activeTab === "en" ? () => void translateField("content", content.replace(/<[^>]+>/g, " "), setContentEn) : undefined}
                  translating={translating.content}
                  hasValue={!!content}
                />
                {activeTab === "en" && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3">
                    <Sparkles size={13} className="mt-0.5 shrink-0 text-indigo-400" />
                    <p className="text-xs text-indigo-600">
                      Натисніть <strong>«Перекласти все»</strong> або використовуйте кнопки поруч із кожним полем для AI-перекладу.
                    </p>
                  </div>
                )}
                <BlogEditor
                  key={activeTab}
                  initialContent={activeTab === "uk" ? content : contentEn}
                  onChange={(html) => {
                    if (activeTab === "uk") setContent(html);
                    else setContentEn(html);
                    markDirty();
                  }}
                  placeholder={activeTab === "uk" ? "Почніть писати статтю…" : "Write article content in English..."}
                />
              </div>
            </div>

          </div>

          {/* ── Right: sidebar ── */}
          <div className="space-y-4">

            {/* Publish card */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Публікація</p>
              </div>
              <div className="space-y-3 px-4 py-4">
                <Toggle
                  checked={isPublished}
                  onChange={(v) => { setIsPublished(v); markDirty(); }}
                  label={isPublished ? "Опубліковано" : "Чернетка"}
                />
                <Toggle
                  checked={isFeatured}
                  onChange={(v) => { setIsFeatured(v); markDirty(); }}
                  label="На головній (Featured)"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={pending}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 py-2.5 text-xs font-semibold text-zinc-600 transition-all hover:bg-zinc-50 hover:shadow-sm disabled:opacity-40"
                >
                  <Save size={13} /> Зберегти
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={pending}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-primary-700)] hover:shadow-md disabled:opacity-40"
                >
                  {pending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {isPublished ? "Оновити" : "Публікувати"}
                </button>
              </div>
            </div>

            {/* Organization */}
            <SideCard title="Організація" icon={<Settings size={14} />}>
              <div>
                <SideLabel>Категорія</SideLabel>
                <CategoryCombobox
                  value={category}
                  onChange={(v) => { setCategory(v); markDirty(); }}
                  allCategories={allCategories}
                  labels={catLabels}
                  onLabelsChange={setCatLabels}
                />
              </div>
              <div>
                <SideLabel>Теги</SideLabel>
                <TagInput
                  value={tags}
                  onChange={(next) => { setTags(next); markDirty(); }}
                  suggestions={allTags}
                  translationsEn={tagTransl}
                  onTranslationChange={setTagTransl}
                  autoTranslate={true}
                  placeholder="Додати тег..."
                />
              </div>
            </SideCard>

            {/* SEO */}
            <SideCard title="SEO" icon={<Search size={14} />}>
              {/* AI button */}
              <button
                type="button"
                onClick={() => void handleGenerateSeo()}
                disabled={seoLoading || (!title && !excerpt)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-50"
              >
                {seoLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                AI-генерація SEO
              </button>

              <div>
                <SideLabel>SEO Title</SideLabel>
                <SideInput
                  type="text"
                  value={seoTitle}
                  onChange={(e) => { setSeoTitle(e.target.value); markDirty(); }}
                  maxLength={60}
                  placeholder="Заголовок для пошуку..."
                />
                <CharBar value={seoTitle.length} max={60} warnAt={50} />
              </div>

              <div>
                <SideLabel>SEO Description</SideLabel>
                <textarea
                  value={seoDescription}
                  onChange={(e) => { setSeoDescription(e.target.value); markDirty(); }}
                  maxLength={160}
                  rows={3}
                  placeholder="Короткий опис для пошуку..."
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 outline-none transition-all focus:border-[var(--color-primary-300)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary-100)]"
                />
                <CharBar value={seoDescription.length} max={160} warnAt={140} />
              </div>

              {/* EN SEO */}
              <div className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">🇬🇧 EN SEO</span>
                  <button
                    type="button"
                    onClick={() => void (async () => {
                      const toTranslate = [seoTitle, seoDescription].filter(Boolean);
                      if (!toTranslate.length) return;
                      setFieldTranslating("seo", true);
                      const res = await aiTranslateTexts(toTranslate);
                      setFieldTranslating("seo", false);
                      if (res) {
                        if (seoTitle && res[0]) setSeoTitleEn(res[0]);
                        if (seoDescription && res[seoTitle ? 1 : 0]) setSeoDescriptionEn(res[seoTitle ? 1 : 0]!);
                        markDirty();
                        toast.success("SEO перекладено");
                      }
                    })()}
                    disabled={translating.seo || (!seoTitle && !seoDescription)}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-500 shadow-sm transition hover:shadow disabled:opacity-40"
                  >
                    {translating.seo ? <Loader2 size={9} className="animate-spin" /> : <Languages size={9} />}
                    Перекласти
                  </button>
                </div>
                <input
                  type="text"
                  value={seoTitleEn}
                  onChange={(e) => { setSeoTitleEn(e.target.value); markDirty(); }}
                  maxLength={60}
                  placeholder="SEO title in English..."
                  className="w-full rounded-lg border border-indigo-100 bg-white px-2.5 py-2 text-xs text-zinc-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <textarea
                  value={seoDescriptionEn}
                  onChange={(e) => { setSeoDescriptionEn(e.target.value); markDirty(); }}
                  maxLength={160}
                  rows={2}
                  placeholder="SEO description in English..."
                  className="w-full resize-none rounded-lg border border-indigo-100 bg-white px-2.5 py-2 text-xs text-zinc-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* SERP preview */}
              {(seoTitle || title) && (
                <SerpPreview title={seoTitle || title} description={seoDescription || excerpt} slug={slug} />
              )}
            </SideCard>

            {/* Author */}
            <SideCard title="Автор" icon={<User size={14} />} defaultOpen={false}>
              <div>
                <SideLabel>Ім'я</SideLabel>
                <SideInput
                  type="text"
                  value={authorName}
                  onChange={(e) => { setAuthorName(e.target.value); markDirty(); }}
                />
              </div>
              <div>
                <SideLabel>Аватар (URL)</SideLabel>
                <SideInput
                  type="url"
                  value={authorAvatar}
                  onChange={(e) => { setAuthorAvatar(e.target.value); markDirty(); }}
                  placeholder="https://..."
                />
              </div>
            </SideCard>

            {/* Relations */}
            <SideCard title="Зв'язки" icon={<Globe size={14} />} defaultOpen={false}>
              <div>
                <SideLabel>Пов'язана послуга</SideLabel>
                <SideSelect
                  value={relatedServiceId}
                  onChange={(e) => { setRelatedServiceId(e.target.value); markDirty(); }}
                >
                  <option value="">— Немає —</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </SideSelect>
              </div>
              <div>
                <SideLabel>Пов'язаний продукт</SideLabel>
                <SideSelect
                  value={relatedProductId}
                  onChange={(e) => { setRelatedProductId(e.target.value); markDirty(); }}
                >
                  <option value="">— Немає —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </SideSelect>
              </div>
            </SideCard>

            {/* Danger zone */}
            {initialData?.id && (
              <SideCard title="Небезпечна зона" icon={<Trash2 size={14} />} defaultOpen={false} accent="red">
                <p className="text-xs text-red-500">Видалення статті є незворотною дією.</p>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md disabled:opacity-50"
                >
                  <Trash2 size={14} /> Видалити статтю
                </button>
              </SideCard>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
