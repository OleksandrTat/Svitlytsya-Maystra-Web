"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Clock,
  Eye,
  FileText,
  Heart,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteBlogPostAction,
  toggleBlogPostPublishedAction,
} from "@/actions/admin/blog";
import { BLOG_CATEGORY_LABELS } from "@/lib/constants";
import type { BlogPost } from "@/lib/types";
import { cn, formatInquiryDate } from "@/lib/utils";

type Filter = "all" | "published" | "draft" | "featured";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Всі" },
  { key: "published", label: "Опубліковані" },
  { key: "draft", label: "Чернетки" },
  { key: "featured", label: "Featured" },
];

export function BlogAdminClient({ posts }: { posts: BlogPost[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const published = posts.filter((p) => p.is_published).length;
    const drafts = posts.filter((p) => !p.is_published).length;
    const views = posts.reduce((sum, p) => sum + p.views_count, 0);
    const likes = posts.reduce((sum, p) => sum + p.likes_count, 0);
    return { published, drafts, views, likes };
  }, [posts]);

  const filtered = useMemo(() => {
    let result = posts;
    if (filter === "published") result = result.filter((p) => p.is_published);
    if (filter === "draft") result = result.filter((p) => !p.is_published);
    if (filter === "featured") result = result.filter((p) => p.is_featured);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q),
      );
    }
    return result;
  }, [posts, filter, search]);

  const handleTogglePublish = (post: BlogPost) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", post.id);
      fd.set("is_published", String(!post.is_published));
      const result = await toggleBlogPostPublishedAction(fd);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = (post: BlogPost) => {
    if (!confirm(`Видалити статтю "${post.title}"?`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", post.id);
      const result = await deleteBlogPostAction(fd);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">Всього: {posts.length} статей</p>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)]"
        >
          <Plus size={16} />
          Нова стаття
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Опубліковано", value: stats.published, icon: FileText, color: "text-emerald-600" },
          { label: "Чернетки", value: stats.drafts, icon: FileText, color: "text-amber-600" },
          { label: "Перегляди", value: stats.views, icon: Eye, color: "text-sky-600" },
          { label: "Лайки", value: stats.likes, icon: Heart, color: "text-red-500" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4"
          >
            <stat.icon size={20} className={stat.color} />
            <div>
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук..."
            className="h-8 w-48 rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-zinc-400"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <FileText size={40} className="mx-auto text-zinc-300" />
          <p className="mt-3 text-zinc-600">Ще немає статей</p>
          <Link
            href="/admin/blog/new"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]"
          >
            <Plus size={14} />
            Написати першу статтю
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((post) => (
            <div
              key={post.id}
              className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50"
            >
              {/* Thumbnail */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                {post.cover_image ? (
                  <Image
                    src={post.cover_image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-400">
                    <FileText size={18} />
                  </div>
                )}
              </div>

              {/* Title + excerpt */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">{post.title}</p>
                <p className="truncate text-xs text-zinc-500">{post.excerpt}</p>
              </div>

              {/* Category */}
              <span className="hidden shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 md:inline">
                {BLOG_CATEGORY_LABELS[post.category] ?? post.category}
              </span>

              {/* Status */}
              <span
                className={cn(
                  "hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold md:inline",
                  post.is_published
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700",
                )}
              >
                {post.is_published ? "Опубліковано" : "Чернетка"}
              </span>

              {/* Meta */}
              <div className="hidden shrink-0 text-right text-xs text-zinc-400 lg:block">
                <p>{formatInquiryDate(post.updated_at)}</p>
                <p className="flex items-center justify-end gap-2">
                  <span className="flex items-center gap-0.5">
                    <Clock size={10} />
                    {post.reading_time_min} хв
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Eye size={10} />
                    {post.views_count}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Heart size={10} />
                    {post.likes_count}
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Link
                  href={`/admin/blog/${post.id}/edit`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200"
                  title="Редагувати"
                >
                  <Pencil size={14} />
                </Link>
                <button
                  type="button"
                  onClick={() => handleTogglePublish(post)}
                  disabled={pending}
                  className="flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium text-zinc-500 hover:bg-zinc-200"
                  title={post.is_published ? "Зняти" : "Опублікувати"}
                >
                  {post.is_published ? "Зняти" : "Опубл."}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(post)}
                  disabled={pending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                  title="Видалити"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
