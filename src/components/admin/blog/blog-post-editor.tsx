"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Eye, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createBlogPostAction, updateBlogPostAction } from "@/actions/admin/blog";
import { requestContentAssist } from "@/lib/admin/request-content-assist";
import type { BlogPost } from "@/lib/types";
import { cn, slugify } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  initialData?: BlogPost | null;
};

type FormState = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  tags: string[];
  author_name: string;
  is_published: boolean;
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
};

const CATEGORIES = ["tips", "design", "materials", "cases", "news", "culture"];

function makeInitialState(post?: BlogPost | null): FormState {
  return {
    id: post?.id,
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    cover_image: post?.cover_image ?? "",
    category: post?.category ?? "tips",
    tags: post?.tags ?? [],
    author_name: post?.author_name ?? "Команда Світлиці",
    is_published: post?.is_published ?? false,
    is_featured: post?.is_featured ?? false,
    seo_title: post?.seo_title ?? "",
    seo_description: post?.seo_description ?? "",
  };
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function estimateReadingTime(value: string) {
  const words = stripHtml(value).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function markdownToHtml(value: string) {
  if (/<[a-z][\s\S]*>/i.test(value)) {
    return value;
  }

  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br />")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white px-3 py-2">
      <div className="mb-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(tags.filter((item) => item !== tag))}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-secondary)]"
          >
            #{tag}
          </button>
        ))}
      </div>
      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== ",") {
            return;
          }

          event.preventDefault();
          const value = input.trim().toLowerCase().replace(/\s+/g, "-");
          if (!value || tags.includes(value)) {
            setInput("");
            return;
          }

          onChange([...tags, value]);
          setInput("");
        }}
        className="w-full bg-transparent text-sm outline-none"
        placeholder="Додати тег і натиснути Enter"
      />
    </div>
  );
}

export function BlogPostEditor({ open, onClose, initialData }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(makeInitialState(initialData));
  const [slugManual, setSlugManual] = useState(Boolean(initialData?.id));
  const [preview, setPreview] = useState(false);
  const [saving, startTransition] = useTransition();
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(makeInitialState(initialData));
    setSlugManual(Boolean(initialData?.id));
    setPreview(false);
  }, [initialData, open]);

  const htmlPreview = markdownToHtml(form.content);
  const readingTime = estimateReadingTime(form.content);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "title" && !slugManual) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  };

  const generateSeo = async () => {
    if (!form.title.trim()) {
      toast.error("Вкажіть назву статті");
      return;
    }

    setAiLoading(true);
    try {
      const result = await requestContentAssist({
        title: form.title,
        content: form.excerpt || stripHtml(form.content),
      });

      setForm((current) => ({
        ...current,
        excerpt: current.excerpt || result.excerpt,
        seo_title: result.seoTitle,
        seo_description: result.seoDescription,
      }));
      toast.success("SEO поля згенеровано");
    } catch {
      toast.error("Не вдалося звернутися до AI");
    } finally {
      setAiLoading(false);
    }
  };

  const save = (publish: boolean) => {
    if (!form.title.trim() || !form.slug.trim() || !form.excerpt.trim() || !form.content.trim()) {
      toast.error("Заповніть title, slug, excerpt і content");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();

      if (form.id) {
        formData.set("id", form.id);
      }

      formData.set("title", form.title.trim());
      formData.set("slug", form.slug.trim());
      formData.set("excerpt", form.excerpt.trim());
      formData.set("content", htmlPreview);
      formData.set("cover_image", form.cover_image.trim());
      formData.set("category", form.category);
      formData.set("tags", form.tags.join(","));
      formData.set("author_name", form.author_name.trim());
      formData.set("is_published", String(publish));
      formData.set("is_featured", String(form.is_featured));
      formData.set("seo_title", form.seo_title.trim());
      formData.set("seo_description", form.seo_description.trim());

      try {
        const result = form.id
          ? await updateBlogPostAction(formData)
          : await createBlogPostAction(formData);

        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        router.refresh();
        onClose();
      } catch {
        toast.error("Не вдалося зберегти статтю");
      }
    });
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] p-4"
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="relative mx-auto flex h-[calc(100vh-2rem)] max-w-7xl flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-white px-6 py-4">
              <div className="min-w-0 flex-1">
                <input
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  className="w-full bg-transparent text-xl font-semibold text-[var(--color-text-primary)] outline-none"
                  placeholder="Назва статті"
                />
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                  <span>/blog/{form.slug || "..."}</span>
                  <span>{readingTime} хв читання</span>
                  <span>{form.tags.length} тегів</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreview((current) => !current)}
                  className={cn(
                    "rounded-2xl border px-4 py-2 text-sm",
                    preview
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-[var(--color-border)]",
                  )}
                >
                  <Eye size={14} className="mr-1 inline" />
                  {preview ? "Редактор" : "Preview"}
                </button>
                <button
                  type="button"
                  onClick={generateSeo}
                  disabled={aiLoading}
                  className="rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-primary)] disabled:opacity-50"
                >
                  <Sparkles size={14} className="mr-1 inline" />
                  {aiLoading ? "AI..." : "AI SEO"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="grid flex-1 overflow-hidden lg:grid-cols-[1.25fr_0.75fr]">
              <div className="overflow-y-auto border-r border-[var(--color-border)]">
                {!preview ? (
                  <textarea
                    value={form.content}
                    onChange={(event) => setField("content", event.target.value)}
                    className="h-full min-h-full w-full resize-none px-6 py-5 text-sm leading-7 outline-none"
                    placeholder="# Почніть писати статтю..."
                  />
                ) : (
                  <div
                    className="prose prose-neutral max-w-none px-6 py-5"
                    dangerouslySetInnerHTML={{ __html: htmlPreview }}
                  />
                )}
              </div>

              <div className="space-y-4 overflow-y-auto bg-[var(--color-surface)] p-6">
                <div className="rounded-[24px] border border-[var(--color-border)] bg-white p-4">
                  <div className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => save(true)}
                      disabled={saving}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? "Збереження..." : "Опублікувати"}
                    </button>
                    <button
                      type="button"
                      onClick={() => save(false)}
                      disabled={saving}
                      className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm"
                    >
                      Зберегти як чернетку
                    </button>
                    {form.slug ? (
                      <Link
                        href={`/blog/${form.slug}`}
                        target="_blank"
                        className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-center text-sm"
                      >
                        Відкрити публічну сторінку
                      </Link>
                    ) : null}
                  </div>
                </div>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">Slug</span>
                  <input
                    value={form.slug}
                    onChange={(event) => {
                      setSlugManual(true);
                      setField("slug", slugify(event.target.value));
                    }}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">Категорія</span>
                  <select
                    value={form.category}
                    onChange={(event) => setField("category", event.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">Excerpt</span>
                  <textarea
                    value={form.excerpt}
                    onChange={(event) => setField("excerpt", event.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">Cover image URL</span>
                  <input
                    value={form.cover_image}
                    onChange={(event) => setField("cover_image", event.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    placeholder="https://..."
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">Автор</span>
                  <input
                    value={form.author_name}
                    onChange={(event) => setField("author_name", event.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                  />
                </label>

                <div className="rounded-[24px] border border-[var(--color-border)] bg-white p-4">
                  <p className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">Теги</p>
                  <TagInput tags={form.tags} onChange={(tags) => setField("tags", tags)} />
                </div>

                <div className="rounded-[24px] border border-[var(--color-border)] bg-white p-4">
                  <label className="flex items-center justify-between py-1">
                    <span className="text-sm text-[var(--color-text-primary)]">Опубліковано</span>
                    <input
                      checked={form.is_published}
                      onChange={(event) => setField("is_published", event.target.checked)}
                      type="checkbox"
                      className="h-4 w-4"
                    />
                  </label>
                  <label className="mt-2 flex items-center justify-between py-1">
                    <span className="text-sm text-[var(--color-text-primary)]">Featured на сайті</span>
                    <input
                      checked={form.is_featured}
                      onChange={(event) => setField("is_featured", event.target.checked)}
                      type="checkbox"
                      className="h-4 w-4"
                    />
                  </label>
                </div>

                <div className="rounded-[24px] border border-[var(--color-border)] bg-white p-4">
                  <div className="grid gap-3">
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">SEO title</span>
                      <input
                        value={form.seo_title}
                        onChange={(event) => setField("seo_title", event.target.value)}
                        className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">SEO description</span>
                      <textarea
                        value={form.seo_description}
                        onChange={(event) => setField("seo_description", event.target.value)}
                        rows={4}
                        className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
