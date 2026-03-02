"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createCulturalPostAction, updateCulturalPostAction } from "@/actions/admin/cultural";
import { TiptapEditor } from "@/components/admin/blog/tiptap-editor";
import { requestContentAssist } from "@/lib/admin/request-content-assist";
import { uploadPublicImage } from "@/lib/storage/upload-public-image";

type CulturalPostFormProps = {
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
    guest_author_name: string | null;
    guest_author_bio: string | null;
    is_published: boolean;
    allow_comments: boolean;
  };
};

type CulturalDraft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  guestAuthorName: string;
  guestAuthorBio: string;
  allowComments: boolean;
  isPublished: boolean;
};

const EXCERPT_SOFT_LIMIT = 220;
const SEO_TITLE_SOFT_LIMIT = 60;
const SEO_DESCRIPTION_SOFT_LIMIT = 160;
const DRAFT_STORAGE_KEY = "admin-cultural-post-draft-v1";

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
  return value.replace(/\s+/g, " ").trim();
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

function readDraft(mode: "create" | "edit") {
  if (mode !== "create" || typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as Partial<CulturalDraft>;
  } catch {
    return null;
  }
}

export function CulturalPostForm({ mode, initialData }: CulturalPostFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const initialDraft = useMemo(() => readDraft(mode), [mode]);

  const [title, setTitle] = useState(initialData?.title ?? initialDraft?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? initialDraft?.slug ?? "");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(
    mode === "edit" || Boolean(initialData?.slug) || Boolean(initialDraft?.slug),
  );

  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? initialDraft?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? initialDraft?.content ?? "");
  const [coverImage, setCoverImage] = useState(initialData?.cover_image ?? initialDraft?.coverImage ?? "");
  const [category, setCategory] = useState(initialData?.category ?? initialDraft?.category ?? "culture");
  const [tags, setTags] = useState(initialData?.tags.join(", ") ?? initialDraft?.tags ?? "");
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title ?? initialDraft?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(
    initialData?.seo_description ?? initialDraft?.seoDescription ?? "",
  );
  const [guestAuthorName, setGuestAuthorName] = useState(
    initialData?.guest_author_name ?? initialDraft?.guestAuthorName ?? "",
  );
  const [guestAuthorBio, setGuestAuthorBio] = useState(
    initialData?.guest_author_bio ?? initialDraft?.guestAuthorBio ?? "",
  );
  const [allowComments, setAllowComments] = useState(
    initialData?.allow_comments ?? initialDraft?.allowComments ?? true,
  );
  const [isPublished, setIsPublished] = useState(initialData?.is_published ?? initialDraft?.isPublished ?? false);

  const [saving, setSaving] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isGeneratingSeoAi, setIsGeneratingSeoAi] = useState(false);
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    initialDraft && mode === "create" ? "Відновлено локальну чернетку." : null,
  );
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({
      title: initialData?.title ?? initialDraft?.title ?? "",
      slug: initialData?.slug ?? initialDraft?.slug ?? "",
      excerpt: initialData?.excerpt ?? initialDraft?.excerpt ?? "",
      content: initialData?.content ?? initialDraft?.content ?? "",
      coverImage: initialData?.cover_image ?? initialDraft?.coverImage ?? "",
      category: initialData?.category ?? initialDraft?.category ?? "culture",
      tags: initialData?.tags.join(", ") ?? initialDraft?.tags ?? "",
      seoTitle: initialData?.seo_title ?? initialDraft?.seoTitle ?? "",
      seoDescription: initialData?.seo_description ?? initialDraft?.seoDescription ?? "",
      guestAuthorName: initialData?.guest_author_name ?? initialDraft?.guestAuthorName ?? "",
      guestAuthorBio: initialData?.guest_author_bio ?? initialDraft?.guestAuthorBio ?? "",
      allowComments: initialData?.allow_comments ?? initialDraft?.allowComments ?? true,
      isPublished: initialData?.is_published ?? initialDraft?.isPublished ?? false,
    }),
  );

  const formTitle = useMemo(
    () => (mode === "create" ? "Нова культурна стаття" : "Редагування культурної статті"),
    [mode],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
      if (!isSaveShortcut) {
        return;
      }

      event.preventDefault();
      formRef.current?.requestSubmit();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    const timeout = window.setTimeout(() => {
      const payload: CulturalDraft = {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        category,
        tags,
        seoTitle,
        seoDescription,
        guestAuthorName,
        guestAuthorBio,
        allowComments,
        isPublished,
      };

      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [
    mode,
    title,
    slug,
    excerpt,
    content,
    coverImage,
    category,
    tags,
    seoTitle,
    seoDescription,
    guestAuthorName,
    guestAuthorBio,
    allowComments,
    isPublished,
  ]);

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        title,
        slug,
        excerpt,
        content,
        coverImage,
        category,
        tags,
        seoTitle,
        seoDescription,
        guestAuthorName,
        guestAuthorBio,
        allowComments,
        isPublished,
      }),
    [
      title,
      slug,
      excerpt,
      content,
      coverImage,
      category,
      tags,
      seoTitle,
      seoDescription,
      guestAuthorName,
      guestAuthorBio,
      allowComments,
      isPublished,
    ],
  );

  const isDirty = currentSnapshot !== savedSnapshot;

  useEffect(() => {
    if (!isDirty || saving) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, saving]);

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

  const applyAiFromContent = async () => {
    if (!stats.plain) {
      setError("Додайте контент перед AI-генерацією.");
      return;
    }

    setIsGeneratingAi(true);
    setError(null);
    setMessage(null);

    try {
      const aiData = await requestContentAssist({
        title: title.trim(),
        content: content.trim(),
      });

      setExcerpt(aiData.excerpt);
      setSeoTitle(aiData.seoTitle);
      setSeoDescription(aiData.seoDescription);
      setMessage("AI згенерував excerpt і SEO.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не вдалося отримати AI-результат.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const applyAiSeoFromContent = async () => {
    if (!stats.plain) {
      setError("Додайте контент перед AI-генерацією SEO.");
      return;
    }

    setIsGeneratingSeoAi(true);
    setError(null);
    setMessage(null);

    try {
      const aiData = await requestContentAssist({
        title: title.trim(),
        content: content.trim(),
      });

      setSeoTitle(aiData.seoTitle);
      setSeoDescription(aiData.seoDescription);
      setMessage("AI згенерував SEO поля.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не вдалося отримати AI-результат для SEO.");
    } finally {
      setIsGeneratingSeoAi(false);
    }
  };

  const uploadCoverImage = async (file: File) => {
    setIsUploadingCoverImage(true);
    setError(null);

    try {
      const { publicUrl } = await uploadPublicImage({
        file,
        folder: "cultural/cover",
      });

      setCoverImage(publicUrl);
      setMessage("Обкладинку завантажено.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не вдалося завантажити обкладинку.");
    } finally {
      setIsUploadingCoverImage(false);
    }
  };

  const resetSlugFromTitle = () => {
    setIsSlugManuallyEdited(false);
    setSlug(slugify(title));
  };

  const clearLocalDraft = () => {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    setMessage("Локальну чернетку очищено.");
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
    formData.set("guest_author_name", guestAuthorName.trim());
    formData.set("guest_author_bio", guestAuthorBio.trim());

    if (allowComments) {
      formData.set("allow_comments", "true");
    }
    if (isPublished) {
      formData.set("is_published", "true");
    }

    const result =
      mode === "create"
        ? await createCulturalPostAction(formData)
        : await updateCulturalPostAction(formData);

    if (!result.ok) {
      setError(result.message);
      setSaving(false);
      return;
    }

    setMessage(result.message);
    setSaving(false);
    setSavedSnapshot(currentSnapshot);

    if (mode === "create") {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }

    router.push("/admin/cultural");
    router.refresh();
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
      <div className="sticky top-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-white/95 p-4 shadow-sm backdrop-blur">
        <div>
          <h1 className="font-display text-2xl text-[var(--color-text-primary)]">{formTitle}</h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {saving ? "Збереження..." : isDirty ? "Є незбережені зміни" : "Усі зміни синхронізовано"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode === "create" ? (
            <button
              type="button"
              onClick={clearLocalDraft}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
            >
              Очистити чернетку
            </button>
          ) : null}

          {mode === "edit" && finalSlug ? (
            <Link
              href={`/cultural/${finalSlug}`}
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
              target="_blank"
              rel="noreferrer"
            >
              Перегляд
            </Link>
          ) : null}

          <Link href="/admin/cultural" className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
            До списку
          </Link>

          <button
            type="button"
            onClick={() => setIsPreviewOpen((value) => !value)}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            {isPreviewOpen ? "Сховати превʼю" : "Попередній перегляд"}
          </button>

          <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={allowComments}
              onChange={(event) => setAllowComments(event.target.checked)}
            />
            Коментарі
          </label>

          <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
            />
            Опублікувати
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Збереження..." : "Зберегти"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
      ) : null}

      {isPreviewOpen ? (
        <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">Попередній перегляд</p>
            <h2 className="mt-1 text-3xl font-semibold text-[var(--color-text-primary)]">
              {title.trim() || "Без назви"}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {(category.trim() || "Без категорії")} · {stats.readingTimeMin} хв читання
              {guestAuthorName.trim() ? ` · Автор: ${guestAuthorName.trim()}` : ""}
            </p>
          </div>

          {coverImagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImagePreview}
              alt="Preview cover"
              className="mb-4 h-56 w-full rounded-2xl border border-[var(--color-border)] object-cover"
            />
          ) : null}

          {excerpt.trim() ? (
            <p className="rounded-xl bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
              {excerpt.trim()}
            </p>
          ) : null}

          <article
            className="
              prose prose-neutral mt-5 max-w-none
              prose-a:text-blue-600
              prose-a:underline
              prose-a:decoration-blue-600/70
              hover:prose-a:text-blue-700
              prose-hr:mx-0
              prose-hr:my-8
              prose-hr:h-px
              prose-hr:w-full
              prose-hr:border-0
              prose-hr:bg-slate-300
            "
            dangerouslySetInnerHTML={{
              __html: content.trim() || "<p class='text-sm text-slate-500'>Додайте контент для перегляду.</p>",
            }}
          />
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="grid gap-4">
              <label className="space-y-1 text-sm">
                <span className="text-[var(--color-text-secondary)]">Заголовок</span>
                <input
                  value={title}
                  onChange={(event) => {
                    const nextTitle = event.target.value;
                    setTitle(nextTitle);

                    if (!isSlugManuallyEdited) {
                      setSlug(slugify(nextTitle));
                    }
                  }}
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
                <p className="text-xs text-[var(--color-text-secondary)]">/cultural/{finalSlug || "..."}</p>
              </div>

              <label className="space-y-1 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--color-text-secondary)]">Короткий опис (excerpt)</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={applyAiFromContent}
                      className="text-xs text-[var(--color-primary)] underline disabled:opacity-60"
                      disabled={!stats.plain || isGeneratingAi}
                    >
                      {isGeneratingAi ? "AI генерує..." : "AI згенерувати"}
                    </button>
                    <button
                      type="button"
                      onClick={applyExcerptFromContent}
                      className="text-xs text-[var(--color-text-secondary)] underline disabled:opacity-60"
                      disabled={!stats.plain || isGeneratingAi}
                    >
                      Швидко
                    </button>
                  </div>
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
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--color-text-secondary)]">Контент</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {stats.words} слів · {stats.readingTimeMin} хв читання
              </p>
            </div>
            <TiptapEditor content={content} onChange={setContent} placeholder="Напишіть текст культурної статті..." />
          </div>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Метадані</h2>

            <div className="space-y-4">
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
                  placeholder="culture, heritage, history"
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
                />
              </label>

              <div className="space-y-2 text-sm">
                <span className="text-[var(--color-text-secondary)]">Cover image URL</span>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(event) => setCoverImage(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
                />
                <label
                  className={`inline-flex cursor-pointer items-center rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs ${
                    isUploadingCoverImage ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  {isUploadingCoverImage ? "Завантаження..." : "Завантажити з ПК"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadCoverImage(file);
                      }
                      event.target.value = "";
                    }}
                    disabled={isUploadingCoverImage}
                  />
                </label>
              </div>

              {coverImagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImagePreview}
                  alt="Cover preview"
                  className="h-40 w-full rounded-xl border border-[var(--color-border)] object-cover"
                />
              ) : null}

              <label className="space-y-1 text-sm">
                <span className="text-[var(--color-text-secondary)]">Гість-автор (опціонально)</span>
                <input
                  value={guestAuthorName}
                  onChange={(event) => setGuestAuthorName(event.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-[var(--color-text-secondary)]">Біо автора (опціонально)</span>
                <input
                  value={guestAuthorBio}
                  onChange={(event) => setGuestAuthorBio(event.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">SEO</h2>
              <button
                type="button"
                onClick={applyAiSeoFromContent}
                className="text-xs text-[var(--color-primary)] underline disabled:opacity-60"
                disabled={!stats.plain || isGeneratingSeoAi}
              >
                {isGeneratingSeoAi ? "AI генерує SEO..." : "AI для SEO"}
              </button>
            </div>

            <div className="space-y-4">
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
          </div>
        </aside>
      </div>

      <p className="text-xs text-[var(--color-text-secondary)]">Підказка: Ctrl+S / Cmd+S для швидкого збереження.</p>
    </form>
  );
}
