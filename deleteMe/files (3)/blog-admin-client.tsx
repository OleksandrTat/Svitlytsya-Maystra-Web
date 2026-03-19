"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  BookOpen, Clock, Eye, EyeOff, Hash, Pencil, Plus,
  Search, Star, Trash2, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { BlogPostEditor } from "@/components/admin/blog/blog-post-editor";
import { cn } from "@/lib/utils";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image?: string | null;
  category: string;
  tags: string[];
  author_name: string;
  reading_time_min: number;
  is_published: boolean;
  is_featured: boolean;
  published_at?: string | null;
  views_count: number;
  updated_at: string;
  seo_title?: string | null;
  seo_description?: string | null;
};

type Props = { posts: BlogPost[] };

const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  tips:      { label: "💡 Поради",    color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  design:    { label: "🎨 Дизайн",    color: "text-violet-700",  bg: "bg-violet-50 border-violet-200" },
  materials: { label: "🪵 Матеріали", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  cases:     { label: "📁 Кейси",     color: "text-sky-700",     bg: "bg-sky-50 border-sky-200" },
  news:      { label: "📰 Новини",    color: "text-zinc-700",    bg: "bg-zinc-50 border-zinc-200" },
  culture:   { label: "🏛 Культура",  color: "text-rose-700",    bg: "bg-rose-50 border-rose-200" },
};

function relDate(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "сьогодні";
  if (d === 1) return "вчора";
  return `${d}д тому`;
}

export function BlogAdminClient({ posts: init }: Props) {
  const [posts, setPosts] = useState(init);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [pubFilter, setPubFilter] = useState<"all" | "published" | "draft">("all");

  const filtered = posts.filter((p) => {
    const q = query.toLowerCase();
    if (q && !p.title.toLowerCase().includes(q) && !p.slug.includes(q)) return false;
    if (catFilter && p.category !== catFilter) return false;
    if (pubFilter === "published" && !p.is_published) return false;
    if (pubFilter === "draft" && p.is_published) return false;
    return true;
  });

  const togglePublish = (id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, is_published: !p.is_published } : p));
    toast.success("Статус публікації оновлено");
  };

  const toggleFeatured = (id: string) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, is_featured: !p.is_featured } : p));
    toast.success("Відображення на головній оновлено");
  };

  const deletePost = (post: BlogPost) => {
    toast.warning(`Видалити «${post.title}»?`, {
      duration: 5000,
      action: {
        label: "Видалити",
        onClick: () => {
          setPosts((prev) => prev.filter((p) => p.id !== post.id));
          toast.success("Статтю видалено");
        },
      },
    });
  };

  const onSaved = (post: BlogPost) => {
    setPosts((prev) =>
      post.id && prev.find((p) => p.id === post.id)
        ? prev.map((p) => p.id === post.id ? { ...p, ...post } : p)
        : [{ ...post, id: post.id || Date.now().toString(), views_count: 0, updated_at: new Date().toISOString() }, ...prev]
    );
  };

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.is_published).length,
    drafts: posts.filter((p) => !p.is_published).length,
    featured: posts.filter((p) => p.is_featured).length,
    totalViews: posts.reduce((s, p) => s + (p.views_count ?? 0), 0),
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Всього",     value: stats.total,      cls: "bg-white border-[var(--color-border)]",        txt: "text-[var(--color-text-primary)]" },
          { label: "Опублікованих", value: stats.published,  cls: "bg-emerald-50 border-emerald-200",             txt: "text-emerald-700" },
          { label: "Чернеток",  value: stats.drafts,     cls: "bg-amber-50 border-amber-200",                  txt: "text-amber-700" },
          { label: "На головній",value: stats.featured,   cls: "bg-violet-50 border-violet-200",                txt: "text-violet-700" },
          { label: "Переглядів",value: stats.totalViews.toLocaleString("uk-UA"), cls: "bg-sky-50 border-sky-200", txt: "text-sky-700" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-3 text-center", s.cls)}>
            <p className={cn("text-2xl font-bold", s.txt)}>{s.value}</p>
            <p className={cn("text-xs", s.txt, "opacity-80")}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2">
          <Search size={14} className="text-[var(--color-text-secondary)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук за назвою або slug..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]" />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          <button type="button" onClick={() => setCatFilter("")}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium transition",
              catFilter === "" ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]" : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]")}>
            Всі
          </button>
          {Object.entries(CAT_META).map(([k, v]) => (
            <button key={k} type="button" onClick={() => setCatFilter(k === catFilter ? "" : k)}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium transition",
                catFilter === k ? cn(v.bg, v.color, "border-current") : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]")}>
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex overflow-hidden rounded-xl border border-[var(--color-border)]">
          {[{ k: "all", l: "Всі" }, { k: "published", l: "Опубліковані" }, { k: "draft", l: "Чернетки" }].map((f) => (
            <button key={f.k} type="button" onClick={() => setPubFilter(f.k as typeof pubFilter)}
              className={cn("px-3 py-2 text-xs font-medium transition",
                pubFilter === f.k ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]")}>
              {f.l}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => { setEditPost(null); setEditorOpen(true); }}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)] transition">
          <Plus size={16} /> Нова стаття
        </button>
      </div>

      {/* Posts grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--color-border)] py-16">
          <BookOpen size={32} className="text-[var(--color-border)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            {query || catFilter || pubFilter !== "all" ? "Нічого не знайдено" : "Ще немає статей"}
          </p>
          <button type="button" onClick={() => setEditorOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">
            <Plus size={14} /> Написати першу статтю
          </button>
        </div>
      ) : (
        <motion.div layout className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((post) => {
              const cat = CAT_META[post.category] ?? CAT_META.tips!;

              return (
                <motion.article key={post.id} layout initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition hover:shadow-md">

                  {/* Cover */}
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200">
                    {post.cover_image ? (
                      <Image src={post.cover_image} alt={post.title} fill
                        className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="400px" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen size={32} className="text-zinc-300" />
                      </div>
                    )}

                    {/* Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm", cat.bg, cat.color)}>
                        {cat.label}
                      </span>
                    </div>
                    <span className={cn("absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm",
                      post.is_published ? "bg-emerald-500/90 text-white" : "bg-zinc-800/70 text-zinc-200")}>
                      {post.is_published ? "Опубліковано" : "Чернетка"}
                    </span>

                    {/* Bottom meta */}
                    <div className="absolute bottom-2 left-3 flex items-center gap-3 text-[10px] text-white/80">
                      <span className="flex items-center gap-0.5"><Clock size={9} /> {post.reading_time_min} хв</span>
                      {post.views_count > 0 && (
                        <span className="flex items-center gap-0.5"><TrendingUp size={9} /> {post.views_count}</span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold leading-tight text-[var(--color-text-primary)] line-clamp-2">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">{post.excerpt}</p>
                    )}

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="flex items-center gap-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]">
                            <Hash size={8} />{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-[var(--color-text-secondary)]">
                      <span>{post.author_name}</span>
                      <span>{relDate(post.updated_at)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 border-t border-[var(--color-border)] pt-2.5">
                      <button type="button" onClick={() => { setEditPost(post); setEditorOpen(true); }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] py-1.5 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition">
                        <Pencil size={12} /> Редагувати
                      </button>

                      <button type="button" onClick={() => toggleFeatured(post.id)}
                        className={cn("rounded-xl border p-1.5 transition",
                          post.is_featured ? "border-amber-300 bg-amber-50 text-amber-600" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-amber-300 hover:text-amber-600")}>
                        <Star size={13} />
                      </button>

                      <button type="button" onClick={() => togglePublish(post.id)}
                        className={cn("rounded-xl border p-1.5 transition",
                          post.is_published
                            ? "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100"
                            : "border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100")}>
                        {post.is_published ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>

                      {post.is_published && (
                        <Link href={`/blog/${post.slug}`} target="_blank"
                          className="rounded-xl border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] hover:border-sky-300 hover:text-sky-600 transition">
                          <Eye size={13} />
                        </Link>
                      )}

                      <button type="button" onClick={() => deletePost(post)}
                        className="rounded-xl border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] hover:border-red-300 hover:text-red-600 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Editor popup */}
      <BlogPostEditor
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditPost(null); }}
        initialData={editPost ?? undefined}
        onSaved={onSaved}
      />
    </div>
  );
}
