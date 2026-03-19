"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Bold, ChevronDown, ChevronUp, Eye, EyeOff, Hash,
  Heading2, Heading3, Image as ImageIcon, List, Minus,
  Quote, Sparkles, X, Check, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type BlogPost = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  tags: string[];
  author_name: string;
  reading_time_min: number;
  is_published: boolean;
  is_featured: boolean;
  seo_title: string;
  seo_description: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  initialData?: Partial<BlogPost>;
  onSaved: (post: BlogPost) => void;
};

const CATEGORIES = [
  { value: "tips",      label: "💡 Поради", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "design",    label: "🎨 Дизайн", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "materials", label: "🪵 Матеріали", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "cases",     label: "📁 Кейси", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "news",      label: "📰 Новини", color: "bg-zinc-50 text-zinc-700 border-zinc-200" },
  { value: "culture",   label: "🏛 Культура", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

const EMPTY: BlogPost = {
  title: "", slug: "", excerpt: "", content: "",
  cover_image: "", category: "tips", tags: [],
  author_name: "Команда Світлиці", reading_time_min: 3,
  is_published: false, is_featured: false,
  seo_title: "", seo_description: "",
};

function slugify(v: string) {
  return v.toLowerCase().trim()
    .replace(/[аА]/g, "a").replace(/[бБ]/g, "b").replace(/[вВ]/g, "v")
    .replace(/[гГ]/g, "h").replace(/[дД]/g, "d").replace(/[еЕ]/g, "e")
    .replace(/[єЄ]/g, "ye").replace(/[жЖ]/g, "zh").replace(/[зЗ]/g, "z")
    .replace(/[иИ]/g, "y").replace(/[іІ]/g, "i").replace(/[їЇ]/g, "yi")
    .replace(/[йЙ]/g, "y").replace(/[кК]/g, "k").replace(/[лЛ]/g, "l")
    .replace(/[мМ]/g, "m").replace(/[нН]/g, "n").replace(/[оО]/g, "o")
    .replace(/[пП]/g, "p").replace(/[рР]/g, "r").replace(/[сС]/g, "s")
    .replace(/[тТ]/g, "t").replace(/[уУ]/g, "u").replace(/[фФ]/g, "f")
    .replace(/[хХ]/g, "kh").replace(/[цЦ]/g, "ts").replace(/[чЧ]/g, "ch")
    .replace(/[шШ]/g, "sh").replace(/[щЩ]/g, "shch").replace(/[ьь]/g, "")
    .replace(/[юЮ]/g, "yu").replace(/[яЯ]/g, "ya")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function estimateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

/* ─── Markdown toolbar ─────────────────────────────────────────────────────── */
function MarkdownToolbar({ onInsert }: { onInsert: (text: string, wrap?: boolean) => void }) {
  const tools = [
    { icon: <Bold size={13} />,     label: "Жирний",       fn: () => onInsert("**текст**") },
    { icon: <Heading2 size={13} />, label: "Заголовок H2", fn: () => onInsert("\n## ") },
    { icon: <Heading3 size={13} />, label: "Заголовок H3", fn: () => onInsert("\n### ") },
    { icon: <List size={13} />,     label: "Список",       fn: () => onInsert("\n- ") },
    { icon: <Quote size={13} />,    label: "Цитата",       fn: () => onInsert("\n> ") },
    { icon: <Minus size={13} />,    label: "Роздільник",   fn: () => onInsert("\n---\n") },
    { icon: <ImageIcon size={13} />,label: "Зображення",   fn: () => onInsert("![alt](url)") },
  ];

  return (
    <div className="flex items-center gap-0.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5">
      {tools.map((tool) => (
        <button key={tool.label} type="button" title={tool.label} onClick={tool.fn}
          className="flex items-center justify-center rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/60 hover:text-[var(--color-text-primary)] transition">
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

/* ─── Tag input ─────────────────────────────────────────────────────────────── */
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState("");

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-2.5 py-1.5">
      {tags.map((tag) => (
        <span key={tag} className="flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-xs">
          <Hash size={9} className="text-[var(--color-text-secondary)]" />
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-[var(--color-text-secondary)] hover:text-red-600">
            <X size={10} />
          </button>
        </span>
      ))}
      <input value={input} onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && input.trim()) {
            e.preventDefault();
            addTag(input);
          }
        }}
        placeholder={tags.length === 0 ? "Додати тег..." : ""}
        className="min-w-[80px] flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--color-text-secondary)]" />
    </div>
  );
}

/* ─── Preview ──────────────────────────────────────────────────────────────── */
function ContentPreview({ content }: { content: string }) {
  // Simplified markdown preview
  const html = content
    .replace(/^### (.+)$/gm, "<h3 class='text-base font-semibold mt-4 mb-1'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-lg font-bold mt-5 mb-2'>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^> (.+)$/gm, "<blockquote class='border-l-4 border-[var(--color-primary)] pl-3 italic text-[var(--color-text-secondary)] my-2'>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc text-sm'>$1</li>")
    .replace(/^---$/gm, "<hr class='border-[var(--color-border)] my-4' />")
    .replace(/!\[(.+?)\]\((.+?)\)/g, "<img src='$2' alt='$1' class='rounded-xl my-3 w-full object-cover' />")
    .replace(/\n\n/g, "<p class='mb-3'>");

  return (
    <div
      className="prose prose-sm max-w-none p-4 text-[var(--color-text-primary)]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ─── Main editor ──────────────────────────────────────────────────────────── */
export function BlogPostEditor({ open, onClose, initialData, onSaved }: Props) {
  const [form, setForm] = useState<BlogPost>({ ...EMPTY, ...initialData });
  const [slugManual, setSlugManual] = useState(!!initialData?.id);
  const [previewMode, setPreviewMode] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const isEdit = !!form.id;

  useEffect(() => {
    setForm({ ...EMPTY, ...initialData });
    setSlugManual(!!initialData?.id);
    setPreviewMode(false);
  }, [initialData, open]);

  const set = <K extends keyof BlogPost>(k: K, v: BlogPost[K]) => {
    setForm((p) => {
      const next = { ...p, [k]: v };
      if (k === "content") next.reading_time_min = estimateReadingTime(v as string);
      if (k === "title" && !slugManual) next.slug = slugify(v as string);
      return next;
    });
  };

  const insertMarkdown = (text: string) => {
    const ta = document.getElementById("blog-content-editor") as HTMLTextAreaElement;
    if (!ta) { set("content", form.content + text); return; }
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const newContent = form.content.slice(0, start) + text + form.content.slice(end);
    set("content", newContent);
    setTimeout(() => {
      ta.setSelectionRange(start + text.length, start + text.length);
      ta.focus();
    }, 0);
  };

  const generateAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/content-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "blog", title: form.title, excerpt: form.excerpt, category: form.category }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.seoTitle) set("seo_title", data.seoTitle);
        if (data.seoDescription) set("seo_description", data.seoDescription);
        if (data.slug && !slugManual) set("slug", data.slug);
        toast.success("AI згенерував SEO");
      }
    } catch { toast.error("Помилка AI"); }
    setAiLoading(false);
  };

  const handleSave = async (publish = form.is_published) => {
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      toast.error("Заповніть назву, slug та контент");
      return;
    }
    setSaving(true);
    try {
      // const fd = new FormData(); ...
      toast.success(publish ? "Статтю опубліковано!" : "Чернетку збережено");
      onSaved({ ...form, is_published: publish });
      onClose();
    } catch { toast.error("Помилка збереження"); }
    setSaving(false);
  };

  const catMeta = CATEGORIES.find((c) => c.value === form.category);
  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex flex-col overflow-hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

          <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="relative z-10 mx-auto mt-6 flex w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-white shadow-2xl"
            style={{ maxHeight: "calc(100vh - 24px)" }}>

            {/* ── Top bar ── */}
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-white px-5 py-3">
              <div className="flex-1 min-w-0">
                <input value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Назва статті..."
                  className="w-full bg-transparent font-display text-xl font-semibold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)]" />
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">/blog/{form.slug || "..."}</span>
                  {catMeta && (
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", catMeta.color)}>
                      {catMeta.label}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
                    <Clock size={9} /> ~{form.reading_time_min} хв · {wordCount} слів
                  </span>
                </div>
              </div>

              {/* View toggle */}
              <div className="flex overflow-hidden rounded-lg border border-[var(--color-border)]">
                <button type="button" onClick={() => setPreviewMode(false)}
                  className={cn("flex items-center gap-1 px-3 py-1.5 text-xs transition",
                    !previewMode ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)]")}>
                  ✏️ Редактор
                </button>
                <button type="button" onClick={() => setPreviewMode(true)}
                  className={cn("flex items-center gap-1 px-3 py-1.5 text-xs transition",
                    previewMode ? "bg-[var(--color-primary)] text-white" : "bg-white text-[var(--color-text-secondary)]")}>
                  <Eye size={12} /> Перегляд
                </button>
              </div>

              {/* AI */}
              <button type="button" onClick={generateAI} disabled={aiLoading || !form.title}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-100)] disabled:opacity-40 transition">
                <Sparkles size={12} /> {aiLoading ? "AI..." : "AI SEO"}
              </button>

              <button type="button" onClick={onClose}
                className="rounded-xl border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]">
                <X size={16} />
              </button>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden">
              {/* Editor / Preview */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {!previewMode ? (
                  <>
                    <MarkdownToolbar onInsert={insertMarkdown} />
                    <textarea
                      id="blog-content-editor"
                      value={form.content}
                      onChange={(e) => set("content", e.target.value)}
                      placeholder={"# Починайте писати...\n\nВикористовуйте Markdown для форматування тексту.\n\n## Заголовок\n\n**жирний текст**, *курсив*\n\n- пункт списку\n- ще один пункт\n\n> Цитата або виділена думка\n\n---\n\n![alt](url) для вставки зображень"}
                      className="flex-1 resize-none px-6 py-4 font-mono text-sm leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)] placeholder:font-sans"
                    />
                  </>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    {form.content ? (
                      <ContentPreview content={form.content} />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
                        Контент порожній — перейдіть в режим редактора
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Right sidebar ── */}
              <div className="w-72 shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="space-y-4 p-4">

                  {/* Publish actions */}
                  <div className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">Публікація</p>
                    <div className="flex flex-col gap-2">
                      <button type="button" onClick={() => handleSave(true)} disabled={saving}
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition">
                        <Eye size={14} /> Опублікувати
                      </button>
                      <button type="button" onClick={() => handleSave(false)} disabled={saving}
                        className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-60 transition">
                        {saving ? "Збереження..." : "Зберегти чернетку"}
                      </button>
                    </div>
                    <label className="flex cursor-pointer items-center justify-between pt-1">
                      <span className="text-xs text-[var(--color-text-secondary)]">Відображати на головній</span>
                      <div
                        className={cn("relative h-5 w-9 rounded-full transition cursor-pointer", form.is_featured ? "bg-amber-500" : "bg-[var(--color-border)]")}
                        onClick={() => set("is_featured", !form.is_featured)}>
                        <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", form.is_featured ? "translate-x-4" : "translate-x-0.5")} />
                      </div>
                    </label>
                  </div>

                  {/* Slug */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Slug</label>
                      {slugManual && (
                        <button type="button" onClick={() => { setSlugManual(false); set("slug", slugify(form.title)); }}
                          className="text-[10px] text-[var(--color-primary)] underline">Авто</button>
                      )}
                    </div>
                    <input value={form.slug}
                      onChange={(e) => { setSlugManual(true); set("slug", slugify(e.target.value)); }}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 font-mono text-xs focus:border-[var(--color-primary)] focus:outline-none" />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Категорія</label>
                    <div className="grid grid-cols-2 gap-1">
                      {CATEGORIES.map((cat) => (
                        <button key={cat.value} type="button"
                          onClick={() => set("category", cat.value)}
                          className={cn("rounded-xl border px-2 py-1.5 text-[10px] font-medium text-left transition",
                            form.category === cat.value
                              ? cat.color
                              : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border)]")}>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Короткий опис (excerpt)</label>
                    <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)}
                      rows={3} placeholder="1-2 речення для анонсу в стрічці..."
                      className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs focus:border-[var(--color-primary)] focus:outline-none" />
                  </div>

                  {/* Cover image */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Cover image URL</label>
                    <input value={form.cover_image} onChange={(e) => set("cover_image", e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs focus:border-[var(--color-primary)] focus:outline-none" />
                  </div>

                  {/* Author */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Автор</label>
                    <input value={form.author_name} onChange={(e) => set("author_name", e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs focus:border-[var(--color-primary)] focus:outline-none" />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Теги (Enter для додавання)</label>
                    <TagInput tags={form.tags} onChange={(t) => set("tags", t)} />
                  </div>

                  {/* SEO */}
                  <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
                    <button type="button" onClick={() => setSeoOpen(!seoOpen)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition">
                      🔍 SEO налаштування
                      {seoOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {seoOpen && (
                      <div className="border-t border-[var(--color-border)] p-3 space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-[var(--color-text-secondary)]">
                            SEO Title <span className={form.seo_title.length > 60 ? "text-amber-600" : ""}>{form.seo_title.length}/60</span>
                          </label>
                          <input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)}
                            className="w-full rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs focus:border-[var(--color-primary)] focus:outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-[var(--color-text-secondary)]">
                            SEO Desc. <span className={form.seo_description.length > 160 ? "text-amber-600" : ""}>{form.seo_description.length}/160</span>
                          </label>
                          <textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)}
                            rows={2} className="w-full resize-none rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs focus:border-[var(--color-primary)] focus:outline-none" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
