"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Eye, EyeOff, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteBlogPostAction,
  toggleFeaturedBlogPostAction,
  togglePublishBlogPostAction,
} from "@/actions/admin/blog";
import { BlogPostEditor } from "@/components/admin/blog/blog-post-editor";
import type { BlogPost } from "@/lib/types";
import { cn, formatInquiryDate } from "@/lib/utils";

type Props = {
  posts: BlogPost[];
};

const CATEGORY_META: Record<string, string> = {
  tips: "bg-amber-50 text-amber-700 border-amber-200",
  design: "bg-violet-50 text-violet-700 border-violet-200",
  materials: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cases: "bg-sky-50 text-sky-700 border-sky-200",
  news: "bg-zinc-50 text-zinc-700 border-zinc-200",
  culture: "bg-rose-50 text-rose-700 border-rose-200",
};

export function BlogAdminClient({ posts: initialPosts }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [publishFilter, setPublishFilter] = useState<"all" | "published" | "draft">("all");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const filteredPosts = posts.filter((post) => {
    const matchesQuery =
      !query ||
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.slug.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !categoryFilter || post.category === categoryFilter;
    const matchesPublish =
      publishFilter === "all" ||
      (publishFilter === "published" && post.is_published) ||
      (publishFilter === "draft" && !post.is_published);

    return matchesQuery && matchesCategory && matchesPublish;
  });

  const togglePublish = (post: BlogPost) => {
    const nextValue = !post.is_published;
    setPosts((current) =>
      current.map((item) => (item.id === post.id ? { ...item, is_published: nextValue } : item)),
    );

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", post.id);
      formData.set("publish", String(nextValue));

      try {
        const result = await togglePublishBlogPostAction(formData);
        if (!result.ok) {
          setPosts((current) =>
            current.map((item) =>
              item.id === post.id ? { ...item, is_published: post.is_published } : item,
            ),
          );
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        router.refresh();
      } catch {
        setPosts((current) =>
          current.map((item) =>
            item.id === post.id ? { ...item, is_published: post.is_published } : item,
          ),
        );
        toast.error("Не вдалося оновити статус публікації");
      }
    });
  };

  const toggleFeatured = (post: BlogPost) => {
    const nextValue = !post.is_featured;
    setPosts((current) =>
      current.map((item) => (item.id === post.id ? { ...item, is_featured: nextValue } : item)),
    );

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", post.id);
      formData.set("featured", String(nextValue));

      try {
        const result = await toggleFeaturedBlogPostAction(formData);
        if (!result.ok) {
          setPosts((current) =>
            current.map((item) =>
              item.id === post.id ? { ...item, is_featured: post.is_featured } : item,
            ),
          );
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        router.refresh();
      } catch {
        setPosts((current) =>
          current.map((item) =>
            item.id === post.id ? { ...item, is_featured: post.is_featured } : item,
          ),
        );
        toast.error("Не вдалося оновити featured статус");
      }
    });
  };

  const removePost = (post: BlogPost) => {
    if (!window.confirm(`Видалити статтю "${post.title}"?`)) {
      return;
    }

    const previous = posts;
    setPosts((current) => current.filter((item) => item.id !== post.id));

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", post.id);

      try {
        const result = await deleteBlogPostAction(formData);
        if (!result.ok) {
          setPosts(previous);
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        router.refresh();
      } catch {
        setPosts(previous);
        toast.error("Не вдалося видалити статтю");
      }
    });
  };

  const stats = {
    total: posts.length,
    published: posts.filter((post) => post.is_published).length,
    drafts: posts.filter((post) => !post.is_published).length,
    featured: posts.filter((post) => post.is_featured).length,
  };

  const categories = Array.from(new Set(posts.map((post) => post.category))).sort();

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-[var(--color-border)] bg-white p-5">
          <p className="text-2xl font-semibold text-[var(--color-text-primary)]">{stats.total}</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Всього статей</p>
        </div>
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-2xl font-semibold text-emerald-700">{stats.published}</p>
          <p className="mt-1 text-sm text-emerald-700/80">Опубліковані</p>
        </div>
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
          <p className="text-2xl font-semibold text-amber-700">{stats.drafts}</p>
          <p className="mt-1 text-sm text-amber-700/80">Чернетки</p>
        </div>
        <div className="rounded-[24px] border border-violet-200 bg-violet-50 p-5">
          <p className="text-2xl font-semibold text-violet-700">{stats.featured}</p>
          <p className="mt-1 text-sm text-violet-700/80">Featured</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--color-border)] bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3">
            <Search size={14} className="text-[var(--color-text-secondary)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Пошук по title або slug"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm"
          >
            <option value="">Усі категорії</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={publishFilter}
            onChange={(event) => setPublishFilter(event.target.value as typeof publishFilter)}
            className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm"
          >
            <option value="all">Усі</option>
            <option value="published">Опубліковані</option>
            <option value="draft">Чернетки</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setEditPost(null);
              setEditorOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            Нова стаття
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-white shadow-sm"
          >
            <div className="relative h-48 bg-[var(--color-surface)]">
              {post.cover_image ? (
                <Image src={post.cover_image} alt={post.title} fill className="object-cover" sizes="400px" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="h-10 w-10 text-[var(--color-text-secondary)]/40" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-4 py-3 text-white">
                <p className="line-clamp-2 text-lg font-semibold">{post.title}</p>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    CATEGORY_META[post.category] ?? "border-[var(--color-border)] bg-[var(--color-surface)]",
                  )}
                >
                  {post.category}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    post.is_published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                  )}
                >
                  {post.is_published ? "Опубліковано" : "Чернетка"}
                </span>
                {post.is_featured ? (
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                    Featured
                  </span>
                ) : null}
              </div>

              {post.excerpt ? (
                <p className="line-clamp-3 text-sm text-[var(--color-text-secondary)]">{post.excerpt}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {post.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px] text-[var(--color-text-secondary)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                <span>{post.author_name}</span>
                <span>{formatInquiryDate(post.updated_at)}</span>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditPost(post);
                    setEditorOpen(true);
                  }}
                  className="rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)]"
                >
                  <Pencil size={14} className="mr-1 inline" />
                  Редагувати
                </button>

                <button
                  type="button"
                  onClick={() => toggleFeatured(post)}
                  disabled={pending}
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-sm",
                    post.is_featured
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)]",
                  )}
                >
                  <Star size={14} className="inline" />
                </button>

                <button
                  type="button"
                  onClick={() => togglePublish(post)}
                  disabled={pending}
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-sm",
                    post.is_published
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700",
                  )}
                >
                  {post.is_published ? (
                    <EyeOff size={14} className="inline" />
                  ) : (
                    <Eye size={14} className="inline" />
                  )}
                </button>

                {post.is_published ? (
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)]"
                  >
                    <Eye size={14} className="mr-1 inline" />
                    View
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={() => removePost(post)}
                  disabled={pending}
                  className="rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)]"
                >
                  <Trash2 size={14} className="inline" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <BlogPostEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditPost(null);
        }}
        initialData={editPost}
      />
    </div>
  );
}
