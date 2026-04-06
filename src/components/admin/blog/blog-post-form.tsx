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
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { BlogEditor } from "./blog-editor";
import { TagInput } from "@/components/admin/shared/tag-input";
import {
  upsertBlogPostAction,
  deleteBlogPostAction,
  generateBlogSlugAction,
} from "@/actions/admin/blog";
import { useAiSeoAssist } from "@/hooks/use-ai-seo-assist";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { BLOG_CATEGORIES } from "@/lib/constants";
import type { BlogPost, Service, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  initialData?: BlogPost | null;
  services: Pick<Service, "id" | "title">[];
  products: Pick<Product, "id" | "title">[];
};

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-[var(--color-primary)]" : "bg-zinc-200",
        )}
      >
        <div className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "left-4" : "left-0.5",
        )} />
      </div>
      <span className="text-sm text-zinc-700">{label}</span>
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
    <div className="mb-1.5 flex items-center justify-between">
      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</label>
      {onTranslate && (
        <button
          type="button"
          onClick={onTranslate}
          disabled={translating || !hasValue}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold transition",
            hasValue
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
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
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Як виглядатиме в Google</p>
      <div className="text-[11px] text-zinc-400">{displayUrl}</div>
      <div className="mt-0.5 text-sm font-medium leading-snug text-blue-700 hover:underline">
        {displayTitle.slice(0, 60)}{displayTitle.length > 60 && "..."}
      </div>
      <div className="mt-0.5 text-xs leading-relaxed text-zinc-500 line-clamp-2">
        {displayDesc.slice(0, 160)}{displayDesc.length > 160 && "..."}
      </div>
    </div>
  );
}

// ─── Sidebar section ──────────────────────────────────────────────────────────
function SideSection({ title, icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
          <span className="text-zinc-400">{icon}</span>
          {title}
        </div>
        <ChevronDown size={14} className={cn("text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-zinc-100 px-4 pb-4 pt-3 space-y-3">{children}</div>}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export function BlogPostForm({ initialData, services, products }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

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
  const [category, setCategory] = useState(initialData?.category ?? "tips");
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
    <div className="flex min-h-screen flex-col">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5">
          <button
            type="button"
            onClick={() => router.push("/admin/blog")}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowLeft size={15} />
            Блог
          </button>

          <div className="h-4 w-px bg-zinc-200" />

          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {pending ? (
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Loader2 size={12} className="animate-spin" /> Збереження…
              </span>
            ) : isDirty ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Незбережені зміни
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <Check size={11} />
                Збережено {lastSaved.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className={cn("h-1.5 w-1.5 rounded-full", isPublished ? "bg-emerald-400" : "bg-zinc-300")} />
                {isPublished ? "Опубліковано" : "Чернетка"}
              </span>
            )}

            {isFeatured && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                <Star size={9} /> Featured
              </span>
            )}
          </div>

          {/* Reading time */}
          {words > 0 && (
            <span className="hidden items-center gap-1 text-xs text-zinc-400 sm:flex">
              <BookOpen size={11} />
              ~{readingTime} хв · {words} слів
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Keyboard hint */}
            <span className="hidden text-[10px] text-zinc-300 lg:block">⌘S зберегти · ⌘↵ публікувати</span>

            {initialData?.slug && (
              <a
                href={`/blog/${initialData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
              >
                <Eye size={13} /> Переглянути
              </a>
            )}
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              <Save size={13} /> Чернетка
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={pending}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-50"
            >
              <Send size={13} />
              {isPublished ? "Оновити" : "Опублікувати"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">

          {/* ── Left: editor ── */}
          <div className="space-y-4">

            {/* Cover image */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200">
              {coverImage ? (
                <div className="group relative aspect-[21/9]">
                  <Image src={coverImage} alt="" fill className="object-cover" sizes="900px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <button
                    type="button"
                    onClick={() => { setCoverImage(""); markDirty(); }}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-md backdrop-blur-sm transition hover:bg-white"
                  >
                    <X size={15} />
                  </button>
                  <label
                    {...getRootProps()}
                    className="absolute bottom-3 left-3 flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-md backdrop-blur-sm transition hover:bg-white"
                  >
                    <input {...getInputProps()} />
                    <ImagePlus size={12} /> Змінити
                  </label>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex aspect-[21/9] cursor-pointer flex-col items-center justify-center gap-3 transition",
                    isDragActive
                      ? "bg-blue-50 text-blue-500"
                      : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100",
                  )}
                >
                  <input {...getInputProps()} />
                  {coverUploading ? (
                    <Loader2 size={28} className="animate-spin text-zinc-300" />
                  ) : (
                    <ImagePlus size={28} className="text-zinc-300" />
                  )}
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {coverUploading ? "Завантаження…" : isDragActive ? "Відпустіть файл" : "Перетягніть обкладинку"}
                    </p>
                    <p className="text-xs opacity-60">JPG / PNG / WEBP до 10MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Language tabs */}
            <div className="flex items-center justify-between">
              <div className="flex overflow-hidden rounded-xl border border-zinc-200">
                <button
                  type="button"
                  onClick={() => setActiveTab("uk")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition",
                    activeTab === "uk"
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-white text-zinc-500 hover:bg-zinc-50",
                  )}
                >
                  🇺🇦 Українська
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("en")}
                  className={cn(
                    "flex items-center gap-2 border-l border-zinc-200 px-4 py-2 text-sm font-medium transition",
                    activeTab === "en"
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-white text-zinc-500 hover:bg-zinc-50",
                  )}
                >
                  🇬🇧 English
                  {hasEnTranslation && (
                    <span className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      activeTab === "en" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700",
                    )}>
                      ✓
                    </span>
                  )}
                </button>
              </div>

              {/* Translate all button */}
              <button
                type="button"
                onClick={() => void handleTranslateAll()}
                disabled={translatingAll || (!title && !excerpt && !content)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition",
                  translatingAll || (!title && !excerpt && !content)
                    ? "cursor-not-allowed border-zinc-100 text-zinc-300"
                    : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
                )}
              >
                {translatingAll ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Перекласти все
              </button>
            </div>

            {/* ── 🇺🇦 Ukrainian content ── */}
            {activeTab === "uk" && (
              <div className="space-y-4">
                {/* Title */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                  placeholder="Заголовок статті..."
                  className="w-full border-0 bg-transparent font-[Cormorant,serif] text-4xl font-bold text-zinc-900 outline-none placeholder:text-zinc-300"
                />

                {/* Slug */}
                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <Globe size={13} className="shrink-0 text-zinc-400" />
                  <span className="text-xs text-zinc-400">/blog/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => { setSlug(e.target.value); markDirty(); }}
                    placeholder="slug-url"
                    className="min-w-0 flex-1 bg-transparent text-sm text-zinc-700 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleAutoSlug()}
                    title="Згенерувати зі заголовку"
                    className="rounded p-1 text-zinc-400 hover:text-zinc-700"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>

                {/* Excerpt */}
                <div>
                  <FieldLabel label="Анонс" />
                  <textarea
                    value={excerpt}
                    onChange={(e) => { setExcerpt(e.target.value); markDirty(); }}
                    placeholder="Короткий опис статті..."
                    maxLength={300}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                  />
                  <p className="mt-1 text-right text-xs text-zinc-400">{excerpt.length}/300</p>
                </div>

                {/* Content editor */}
                <div>
                  <FieldLabel label="Контент" />
                  <BlogEditor
                    initialContent={content}
                    onChange={(html) => { setContent(html); markDirty(); }}
                  />
                </div>
              </div>
            )}

            {/* ── 🇬🇧 English content ── */}
            {activeTab === "en" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3">
                  <p className="text-xs text-blue-600">
                    Натисніть <strong>«Перекласти все»</strong> або використовуйте кнопки поруч із кожним полем.
                    Після збереження переклад буде видно англомовним користувачам.
                  </p>
                </div>

                {/* Title EN */}
                <div>
                  <FieldLabel
                    label="Заголовок (EN)"
                    onTranslate={() => void translateField("title", title, setTitleEn)}
                    translating={translating.title}
                    hasValue={!!title}
                  />
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => { setTitleEn(e.target.value); markDirty(); }}
                    placeholder="Article title..."
                    className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 font-[Cormorant,serif] text-3xl font-bold text-zinc-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Excerpt EN */}
                <div>
                  <FieldLabel
                    label="Анонс (EN)"
                    onTranslate={() => void translateField("excerpt", excerpt, setExcerptEn)}
                    translating={translating.excerpt}
                    hasValue={!!excerpt}
                  />
                  <textarea
                    value={excerptEn}
                    onChange={(e) => { setExcerptEn(e.target.value); markDirty(); }}
                    placeholder="Short article description..."
                    maxLength={300}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm text-zinc-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-right text-xs text-zinc-400">{excerptEn.length}/300</p>
                </div>

                {/* Content EN */}
                <div>
                  <FieldLabel
                    label="Контент (EN)"
                    onTranslate={() => void translateField("content", content.replace(/<[^>]+>/g, " "), setContentEn)}
                    translating={translating.content}
                    hasValue={!!content}
                  />
                  <BlogEditor
                    key="en-editor"
                    initialContent={contentEn}
                    onChange={(html) => { setContentEn(html); markDirty(); }}
                    placeholder="Write article content in English..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Right: sidebar ── */}
          <div className="space-y-3">

            {/* Publish status */}
            <SideSection title="Публікація" icon={<Send size={14} />}>
              <Toggle
                checked={isPublished}
                onChange={(v) => { setIsPublished(v); markDirty(); }}
                label={isPublished ? "Опубліковано" : "Чернетка"}
              />
              <Toggle
                checked={isFeatured}
                onChange={(v) => { setIsFeatured(v); markDirty(); }}
                label="Featured (на головній)"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={pending}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                >
                  <Save size={12} /> Зберегти
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={pending}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-primary)] py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-50"
                >
                  <Send size={12} />
                  {isPublished ? "Оновити" : "Публікувати"}
                </button>
              </div>
            </SideSection>

            {/* Organization */}
            <SideSection title="Організація" icon={<Settings size={14} />}>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Категорія</label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  {BLOG_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Теги</label>
                <TagInput
                  value={tags}
                  onChange={(next) => { setTags(next); markDirty(); }}
                  placeholder="Додати тег..."
                />
              </div>
            </SideSection>

            {/* Author */}
            <SideSection title="Автор" icon={<User size={14} />} defaultOpen={false}>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Ім'я</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => { setAuthorName(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Аватар (URL)</label>
                <input
                  type="url"
                  value={authorAvatar}
                  onChange={(e) => { setAuthorAvatar(e.target.value); markDirty(); }}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </div>
            </SideSection>

            {/* SEO */}
            <SideSection title="SEO" icon={<Search size={14} />}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Мета-дані для пошуку</span>
                <button
                  type="button"
                  onClick={() => void handleGenerateSeo()}
                  disabled={seoLoading || (!title && !excerpt)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {seoLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  AI генерація
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-500">SEO Title</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => { setSeoTitle(e.target.value); markDirty(); }}
                  maxLength={60}
                  placeholder="Заголовок для пошуку..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100">
                    <div className={cn("h-1 rounded-full transition-all", seoTitle.length > 50 ? "bg-amber-400" : "bg-emerald-400")}
                      style={{ width: `${Math.min(100, (seoTitle.length / 60) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-zinc-400">{seoTitle.length}/60</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-500">SEO Description</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => { setSeoDescription(e.target.value); markDirty(); }}
                  maxLength={160}
                  rows={3}
                  placeholder="Короткий опис для пошуку..."
                  className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100">
                    <div className={cn("h-1 rounded-full transition-all", seoDescription.length > 140 ? "bg-amber-400" : "bg-emerald-400")}
                      style={{ width: `${Math.min(100, (seoDescription.length / 160) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-zinc-400">{seoDescription.length}/160</span>
                </div>
              </div>

              {/* EN SEO */}
              <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">🇬🇧 EN SEO</span>
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
                    className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:underline disabled:opacity-40"
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
                  className="w-full rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-400"
                />
                <textarea
                  value={seoDescriptionEn}
                  onChange={(e) => { setSeoDescriptionEn(e.target.value); markDirty(); }}
                  maxLength={160}
                  rows={2}
                  placeholder="SEO description in English..."
                  className="w-full resize-none rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-400"
                />
              </div>

              {/* SERP preview */}
              {(seoTitle || title) && (
                <SerpPreview title={seoTitle || title} description={seoDescription || excerpt} slug={slug} />
              )}
            </SideSection>

            {/* Relations */}
            <SideSection title="Зв'язки" icon={<Globe size={14} />} defaultOpen={false}>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Послуга</label>
                <select
                  value={relatedServiceId}
                  onChange={(e) => { setRelatedServiceId(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="">— Немає —</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Продукт</label>
                <select
                  value={relatedProductId}
                  onChange={(e) => { setRelatedProductId(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="">— Немає —</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            </SideSection>

            {/* Danger zone */}
            {initialData?.id && (
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                <p className="mb-3 text-xs font-semibold text-red-700">Небезпечна зона</p>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Видалити статтю
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
