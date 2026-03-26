"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  Eye,
  ImagePlus,
  Loader2,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
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

export function BlogPostForm({ initialData, services, products }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // State
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
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
  const [isDirty, setIsDirty] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const { generate: generateSeo, loading: seoLoading } = useAiSeoAssist();

  // Cover image upload
  const onCoverDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const extension = file.name.split(".").pop() ?? "jpg";
      const path = `blog/covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      const { error } = await supabase.storage.from("blog-images").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
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

  const coverDropzone = useDropzone({
    onDrop: onCoverDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  // AI SEO generation
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

  // Track dirty state
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  // Auto-generate slug
  const handleAutoSlug = async () => {
    if (!title) return;
    const newSlug = await generateBlogSlugAction(title);
    setSlug(newSlug);
    markDirty();
  };

  // Submit
  const handleSubmit = (publish: boolean) => {
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
      fd.set("reading_time_min", "0"); // will be calculated
      fd.set("is_published", String(publish));
      fd.set("is_featured", String(isFeatured));
      fd.set("seo_title", seoTitle);
      fd.set("seo_description", seoDescription);
      fd.set("author_name", authorName);
      fd.set("author_avatar", authorAvatar);
      fd.set("related_service_id", relatedServiceId);
      fd.set("related_product_id", relatedProductId);

      const result = await upsertBlogPostAction(fd);
      if (result.ok) {
        toast.success(result.message);
        setIsDirty(false);
        if (!initialData?.id && result.data) {
          router.replace(`/admin/blog/${result.data.id}/edit`);
        }
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  // Delete
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, excerpt, content, coverImage, category, tags, isFeatured, seoTitle, seoDescription, authorName, authorAvatar, relatedServiceId, relatedProductId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/blog")}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft size={16} />
          Назад
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <Save size={14} />
            Зберегти чернетку
          </button>
          {initialData?.slug && (
            <a
              href={`/blog/${initialData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              <Eye size={14} />
              Переглянути
            </a>
          )}
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)] disabled:opacity-50"
          >
            <Send size={14} />
            Опублікувати
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Left — Content */}
        <div className="space-y-5">
          {/* Cover image */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Обкладинка
            </label>
            {coverImage ? (
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-zinc-200">
                <Image src={coverImage} alt="" fill className="object-cover" sizes="800px" />
                <button
                  type="button"
                  onClick={() => { setCoverImage(""); markDirty(); }}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-zinc-600 shadow backdrop-blur-sm hover:bg-white"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                {...coverDropzone.getRootProps()}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed py-10 text-sm transition",
                  coverDropzone.isDragActive
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-100)] text-[var(--color-primary)]"
                    : "border-zinc-300 text-zinc-400 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
                )}
              >
                <input {...coverDropzone.getInputProps()} />
                {coverUploading ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <ImagePlus size={22} />
                )}
                <p>{coverUploading ? "Завантаження..." : coverDropzone.isDragActive ? "Відпустіть фото..." : "Перетягніть або натисніть для завантаження"}</p>
                <p className="text-xs opacity-60">JPG / PNG / WEBP до 10MB</p>
              </div>
            )}
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            placeholder="Заголовок статті"
            className="w-full border-0 bg-transparent font-[Cormorant] text-4xl font-bold text-zinc-900 outline-none placeholder:text-zinc-300"
          />

          {/* Slug */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">/blog/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); markDirty(); }}
              placeholder="slug"
              className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-zinc-400"
            />
            <button
              type="button"
              onClick={handleAutoSlug}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
              title="Згенерувати з заголовку"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Excerpt */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Анонс
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => { setExcerpt(e.target.value); markDirty(); }}
              placeholder="Короткий опис статті (до 300 символів)"
              maxLength={300}
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <p className="mt-1 text-right text-xs text-zinc-400">{excerpt.length}/300</p>
          </div>

          {/* Editor */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Контент
            </label>
            <BlogEditor
              initialContent={content}
              onChange={(html) => { setContent(html); markDirty(); }}
            />
          </div>
        </div>

        {/* Right — Sidebar */}
        <div className="space-y-5">
          {/* Publish panel */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-zinc-900">Публікація</h3>
            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => { setIsFeatured(e.target.checked); markDirty(); }}
                  className="rounded"
                />
                <Star size={14} className="text-amber-500" />
                Featured стаття
              </label>
              <p className="text-xs text-zinc-400">
                Статус: {isPublished ? "Опубліковано" : "Чернетка"}
              </p>
            </div>
          </div>

          {/* Organization */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-zinc-900">Організація</h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Категорія</label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  {BLOG_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
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
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Автор</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => { setAuthorName(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Аватар автора (URL)</label>
                <input
                  type="url"
                  value={authorAvatar}
                  onChange={(e) => { setAuthorAvatar(e.target.value); markDirty(); }}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">SEO</h3>
              <button
                type="button"
                onClick={() => void handleGenerateSeo()}
                disabled={seoLoading || (!title && !excerpt)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:from-violet-600 hover:to-indigo-600 disabled:opacity-50"
              >
                {seoLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-500">SEO Title (60 символів)</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => { setSeoTitle(e.target.value); markDirty(); }}
                  maxLength={60}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
                <div className="mt-1 h-1 rounded-full bg-zinc-100">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-all",
                      seoTitle.length > 50 ? "bg-amber-400" : "bg-emerald-400",
                    )}
                    style={{ width: `${Math.min(100, (seoTitle.length / 60) * 100)}%` }}
                  />
                </div>
                <p className="mt-0.5 text-right text-[10px] text-zinc-400">{seoTitle.length}/60</p>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">
                  SEO Description (160 символів)
                </label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => { setSeoDescription(e.target.value); markDirty(); }}
                  maxLength={160}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
                <div className="mt-1 h-1 rounded-full bg-zinc-100">
                  <div
                    className={cn(
                      "h-1 rounded-full transition-all",
                      seoDescription.length > 140 ? "bg-amber-400" : "bg-emerald-400",
                    )}
                    style={{ width: `${Math.min(100, (seoDescription.length / 160) * 100)}%` }}
                  />
                </div>
                <p className="mt-0.5 text-right text-[10px] text-zinc-400">
                  {seoDescription.length}/160
                </p>
              </div>
            </div>
          </div>

          {/* Relations */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-zinc-900">Зв&rsquo;язки</h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-500">Пов&rsquo;язана послуга</label>
                <select
                  value={relatedServiceId}
                  onChange={(e) => { setRelatedServiceId(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="">— Немає —</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500">
                  Пов&rsquo;язаний продукт
                </label>
                <select
                  value={relatedProductId}
                  onChange={(e) => { setRelatedProductId(e.target.value); markDirty(); }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="">— Немає —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          {initialData?.id && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
              <h3 className="text-sm font-semibold text-red-900">Небезпечна зона</h3>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={14} />
                Видалити статтю
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
