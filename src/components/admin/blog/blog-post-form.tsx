"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

export function BlogPostForm({ mode, initialData }: BlogPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();

    if (mode === "edit" && initialData?.id) {
      formData.set("id", initialData.id);
    }
    formData.set("title", title);
    formData.set("slug", slug || slugify(title));
    formData.set("excerpt", excerpt);
    formData.set("content", content);
    formData.set("cover_image", coverImage);
    formData.set("category", category);
    formData.set("tags", tags);
    formData.set("seo_title", seoTitle);
    formData.set("seo_description", seoDescription);
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
        <Link href="/admin/blog" className="text-sm underline">
          До списку статей
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">Заголовок</span>
          <input
            value={title}
            onChange={(event) => {
              const nextTitle = event.target.value;
              setTitle(nextTitle);
              if (!slug) {
                setSlug(slugify(nextTitle));
              }
            }}
            required
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">Slug</span>
          <input
            value={slug}
            onChange={(event) => setSlug(slugify(event.target.value))}
            required
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-secondary)]">Короткий опис (excerpt)</span>
          <textarea
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            rows={3}
            required
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">Категорія</span>
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">Теги (через кому)</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="text-[var(--color-text-secondary)]">Cover image URL</span>
          <input
            type="url"
            value={coverImage}
            onChange={(event) => setCoverImage(event.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-[var(--color-text-secondary)]">Контент</p>
        <TiptapEditor content={content} onChange={setContent} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">SEO title</span>
          <input
            value={seoTitle}
            onChange={(event) => setSeoTitle(event.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-[var(--color-text-secondary)]">SEO description</span>
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
