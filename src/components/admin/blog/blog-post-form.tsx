"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createBlogPostAction,
  updateBlogPostAction,
} from "@/actions/admin/blog";
import { TiptapEditor } from "@/components/admin/blog/tiptap-editor";

type BlogPostFormProps = {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    cover_image: string | null;
    category: string;
    tags: string[];
    seo_title: string | null;
    seo_description: string | null;
    is_published: boolean;
  };
};

const EXCERPT_SOFT_LIMIT = 220;
const SEO_TITLE_SOFT_LIMIT = 60;
const SEO_DESCRIPTION_SOFT_LIMIT = 160;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

function getContentStats(html: string) {
  const plain = normalizeWhitespace(stripHtml(html));
  const words = plain ? plain.split(" ").length : 0;

  return {
    plain,
    words,
    readingTimeMin: Math.max(1, Math.ceil(words / 200)),
  };
}

export function BlogPostForm({ mode, initialData }: BlogPostFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(mode === "edit");

  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [coverImage, setCoverImage] = useState(initialData?.cover_image ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "materials");
  const [tags, setTags] = useState(initialData?.tags.join(", ") ?? "");
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description ?? "");
  const [isPublished, setIsPublished] = useState(initialData?.is_published ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const formTitle = useMemo(() => {
    return mode === "create" ? "Нова стаття" : "Редагування статті";
  }, [mode]);

  useEffect(() => {
    if (isSlugManuallyEdited) {
      return;
    }

    setSlug(slugify(title));
  }, [title, isSlugManuallyEdited]);

  const finalSlug = useMemo(() => slugify(slug || title), [slug, title]);
  const stats = useMemo(() => getContentStats(content), [content]);
  const excerptLength = excerpt.trim().length;
  const seoTitleLength = seoTitle.trim().length;
  const seoDescriptionLength = seoDescription.trim().length;

  const coverImagePreview = useMemo(() => {
    const value = coverImage.trim();
    if (!value) {
      return null;
    }

    return /^https?:\/\//i.test(value) ? value : null;
  }, [coverImage]);

  const applyExcerptFromContent = () => {
    if (!stats.plain) {
      return;
    }

    const nextExcerpt = stats.plain.slice(0, EXCERPT_SOFT_LIMIT).trim();
    setExcerpt(nextExcerpt);
  };

  const resetSlugFromTitle = () => {
    setIsSlugManuallyEdited(false);
    setSlug(slugify(title));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const trimmedTitle = title.trim();
    const trimmedExcerpt = excerpt.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !finalSlug || !trimmedExcerpt || !stats.plain || !trimmedContent) {
      setSaving(false);
      setError("Заповніть обов'язкові поля: title, slug, excerpt, content.");
      return;
    }

    const formData = new FormData();

    if (mode === "edit" && initialData?.id) {
      formData.set("id", initialData.id);
    }

    formData.set("title", trimmedTitle);
    formData.set("slug", finalSlug);
    formData.set("excerpt", trimmedExcerpt);
    formData.set("content", trimmedContent);
    formData.set("cover_image", coverImage.trim());
    formData.set("category", category.trim());
    formData.set("tags", tags.trim());
    formData.set("seo_title", seoTitle.trim());
    formData.set("seo_description", seoDescription.trim());

    if (isPublished) {
      formData.set("is_published", "true");
    }

    const result =
      mode === "create"
        ? await createBlogPostAction(formData)
        : await updateBlogPostAction(formData);

    if (!result.ok) {
      setError(result.message);
      setSaving(false);
      return;
    }

    setMessage(result.message);
    setSaving(false);
    router.push("/admin/blog");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-[var(--color-text-primary)]">{formTitle}</h1>
        <div className="flex items-center gap-3 text-sm">
          {mode === "edit" && finalSlug ? (
            <Link href={`/blog/${finalSlug}`} className="underline" target="_blank" rel="noreferrer">
              Перегляд статті
            </Link>
          ) : null}
          <Link href="/admin/blog" className="underline">
            До списку статей
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">Заголовок</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
        </label>

        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--color-text-secondary)]">Slug</span>
            <button
              type="button"
              onClick={resetSlugFromTitle}
              className="text-xs text-[var(--color-primary)] underline"
            >
              Синхронізувати з title
            </button>
          </div>
          <input
            value={slug}
            onChange={(event) => {
              setIsSlugManuallyEdited(true);
              setSlug(slugify(event.target.value));
            }}
            required
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
          <p className="text-xs text-[var(--color-text-secondary)]">/blog/{finalSlug || "..."}</p>
        </div>

        <label className="space-y-1 text-sm md:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--color-text-secondary)]">Короткий опис (excerpt)</span>
            <button
              type="button"
              onClick={applyExcerptFromContent}
              className="text-xs text-[var(--color-primary)] underline"
              disabled={!stats.plain}
            >
              Згенерувати з контенту
            </button>
          </div>
          <textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            rows={3}
            required
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
          <p
            className={`text-xs ${excerptLength > EXCERPT_SOFT_LIMIT ? "text-amber-700" : "text-[var(--color-text-secondary)]"}`}
          >
            {excerptLength}/{EXCERPT_SOFT_LIMIT} символів
          </p>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">Категорія</span>
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            list="blog-categories"
            required
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
          <datalist id="blog-categories">
            <option value="materials" />
            <option value="design" />
            <option value="care" />
            <option value="cases" />
          </datalist>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">Теги (через кому)</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="oak, finish, interior"
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-secondary)]">Cover image URL</span>
          <input
            type="url"
            value={coverImage}
            onChange={(event) => setCoverImage(event.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
          {coverImagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImagePreview}
              alt="Cover preview"
              className="mt-2 h-40 w-full rounded-xl border border-[var(--color-border)] object-cover"
            />
          ) : null}
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-text-secondary)]">Контент</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {stats.words} слів · {stats.readingTimeMin} хв читання
          </p>
        </div>
        <TiptapEditor content={content} onChange={setContent} placeholder="Напишіть текст статті..." />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--color-text-secondary)]">SEO title</span>
            <span
              className={`text-xs ${seoTitleLength > SEO_TITLE_SOFT_LIMIT ? "text-amber-700" : "text-[var(--color-text-secondary)]"}`}
            >
              {seoTitleLength}/{SEO_TITLE_SOFT_LIMIT}
            </span>
          </div>
          <input
            value={seoTitle}
            onChange={(event) => setSeoTitle(event.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--color-text-secondary)]">SEO description</span>
            <span
              className={`text-xs ${seoDescriptionLength > SEO_DESCRIPTION_SOFT_LIMIT ? "text-amber-700" : "text-[var(--color-text-secondary)]"}`}
            >
              {seoDescriptionLength}/{SEO_DESCRIPTION_SOFT_LIMIT}
            </span>
          </div>
          <input
            value={seoDescription}
            onChange={(event) => setSeoDescription(event.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
        </label>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(event) => setIsPublished(event.target.checked)}
        />
        Опублікувати
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Збереження..." : "Зберегти статтю"}
      </button>
    </form>
  );
}
