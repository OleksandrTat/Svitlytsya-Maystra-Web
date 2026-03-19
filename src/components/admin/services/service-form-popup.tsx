"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upsertServiceAction } from "@/actions/admin";
import { requestContentAssist } from "@/lib/admin/request-content-assist";
import type { Service, ServiceFeature, ServiceProcessStep } from "@/lib/types";
import { slugify } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  initialData?: Service | null;
};

type FormState = {
  id?: string;
  title: string;
  slug: string;
  tagline: string;
  short_description: string;
  description: string;
  icon: string;
  cover_image: string;
  category: string;
  features: ServiceFeature[];
  process_steps: ServiceProcessStep[];
  price_from: string;
  price_unit: string;
  duration_days_from: string;
  duration_days_to: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  seo_title: string;
  seo_description: string;
};

const ICONS = ["🚪", "🪑", "🪟", "🛠️", "💬", "🔧", "🏠", "✨"];
const CATEGORIES = [
  { value: "production", label: "Виробництво" },
  { value: "consultation", label: "Консультація" },
  { value: "installation", label: "Монтаж" },
  { value: "restoration", label: "Реставрація" },
];

function makeInitialState(service?: Service | null): FormState {
  return {
    id: service?.id,
    title: service?.title ?? "",
    slug: service?.slug ?? "",
    tagline: service?.tagline ?? "",
    short_description: service?.short_description ?? "",
    description: service?.description ?? "",
    icon: service?.icon ?? "🚪",
    cover_image: service?.cover_image ?? "",
    category: service?.category ?? "production",
    features: service?.features ?? [],
    process_steps: service?.process_steps ?? [],
    price_from: service?.price_from ? String(service.price_from) : "",
    price_unit: service?.price_unit ?? "грн",
    duration_days_from: service?.duration_days_from ? String(service.duration_days_from) : "",
    duration_days_to: service?.duration_days_to ? String(service.duration_days_to) : "",
    is_active: service?.is_active ?? true,
    is_featured: service?.is_featured ?? false,
    sort_order: service?.sort_order ?? 0,
    seo_title: service?.seo_title ?? "",
    seo_description: service?.seo_description ?? "",
  };
}

export function ServiceFormPopup({ open, onClose, initialData }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(makeInitialState(initialData));
  const [slugManual, setSlugManual] = useState(Boolean(initialData?.id));
  const [saving, startTransition] = useTransition();
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(makeInitialState(initialData));
    setSlugManual(Boolean(initialData?.id));
  }, [initialData, open]);

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
      toast.error("Вкажіть назву сервісу");
      return;
    }

    setAiLoading(true);
    try {
      const result = await requestContentAssist({
        title: form.title,
        content: form.description || form.short_description,
      });

      setForm((current) => ({
        ...current,
        short_description: current.short_description || result.excerpt,
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

  const save = () => {
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error("Заповніть назву і slug");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();

      if (form.id) {
        formData.set("id", form.id);
      }

      formData.set("title", form.title.trim());
      formData.set("slug", form.slug.trim());
      formData.set("tagline", form.tagline.trim());
      formData.set("short_description", form.short_description.trim());
      formData.set("description", form.description.trim());
      formData.set("icon", form.icon);
      formData.set("cover_image", form.cover_image.trim());
      formData.set("category", form.category);
      formData.set(
        "features",
        JSON.stringify(form.features.filter((item) => item.title.trim())),
      );
      formData.set(
        "process_steps",
        JSON.stringify(
          form.process_steps
            .filter((item) => item.title.trim())
            .map((item, index) => ({
              step: index + 1,
              title: item.title.trim(),
              description: item.description.trim(),
            })),
        ),
      );
      formData.set("price_from", form.price_from.trim());
      formData.set("price_unit", form.price_unit.trim());
      formData.set("duration_days_from", form.duration_days_from.trim());
      formData.set("duration_days_to", form.duration_days_to.trim());
      formData.set("is_active", String(form.is_active));
      formData.set("is_featured", String(form.is_featured));
      formData.set("sort_order", String(form.sort_order));
      formData.set("seo_title", form.seo_title.trim());
      formData.set("seo_description", form.seo_description.trim());

      try {
        const result = await upsertServiceAction(formData);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        toast.success(result.message);
        router.refresh();
        onClose();
      } catch {
        toast.error("Не вдалося зберегти сервіс");
      }
    });
  };

  const updateFeature = (index: number, patch: Partial<ServiceFeature>) => {
    setForm((current) => ({
      ...current,
      features: current.features.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  };

  const updateStep = (index: number, patch: Partial<ServiceProcessStep>) => {
    setForm((current) => ({
      ...current,
      process_steps: current.process_steps.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="relative mx-auto flex h-[calc(100vh-2rem)] max-w-6xl flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                  Services
                </p>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {form.id ? "Редагування сервісу" : "Новий сервіс"}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[var(--color-border)] p-2 text-[var(--color-text-secondary)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid flex-1 overflow-hidden lg:grid-cols-[1.35fr_0.95fr]">
              <div className="space-y-5 overflow-y-auto p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Назва</span>
                    <div className="flex gap-2">
                      <input
                        value={form.title}
                        onChange={(event) => setField("title", event.target.value)}
                        className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                        placeholder="Авторські двері"
                      />
                      <button
                        type="button"
                        onClick={generateSeo}
                        disabled={aiLoading || !form.title.trim()}
                        className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-primary)] disabled:opacity-50"
                      >
                        <Sparkles size={14} />
                        {aiLoading ? "AI..." : "AI SEO"}
                      </button>
                    </div>
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Slug</span>
                    <input
                      value={form.slug}
                      onChange={(event) => {
                        setSlugManual(true);
                        setField("slug", slugify(event.target.value));
                      }}
                      className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Слоган</span>
                    <input
                      value={form.tagline}
                      onChange={(event) => setField("tagline", event.target.value)}
                      className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>

                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Cover image URL</span>
                    <input
                      value={form.cover_image}
                      onChange={(event) => setField("cover_image", event.target.value)}
                      className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                      placeholder="https://..."
                    />
                  </label>

                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Короткий опис</span>
                    <textarea
                      value={form.short_description}
                      onChange={(event) => setField("short_description", event.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>

                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Повний опис</span>
                    <textarea
                      value={form.description}
                      onChange={(event) => setField("description", event.target.value)}
                      rows={6}
                      className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>
                </div>

                <div className="rounded-[24px] border border-[var(--color-border)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Переваги</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          features: [...current.features, { title: "", description: "" }],
                        }))
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]"
                    >
                      <Plus size={12} />
                      Додати
                    </button>
                  </div>

                  <div className="space-y-3">
                    {form.features.map((feature, index) => (
                      <div key={`${index}-${feature.title}`} className="grid gap-3 md:grid-cols-[1fr_1.2fr_auto]">
                        <input
                          value={feature.title}
                          onChange={(event) => updateFeature(index, { title: event.target.value })}
                          className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                          placeholder="Назва"
                        />
                        <input
                          value={feature.description}
                          onChange={(event) => updateFeature(index, { description: event.target.value })}
                          className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                          placeholder="Пояснення"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              features: current.features.filter((_, itemIndex) => itemIndex !== index),
                            }))
                          }
                          className="rounded-2xl border border-[var(--color-border)] px-3 text-[var(--color-text-secondary)]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[var(--color-border)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Етапи роботи</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          process_steps: [
                            ...current.process_steps,
                            { step: current.process_steps.length + 1, title: "", description: "" },
                          ],
                        }))
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]"
                    >
                      <Plus size={12} />
                      Додати
                    </button>
                  </div>

                  <div className="space-y-3">
                    {form.process_steps.map((step, index) => (
                      <div key={`${index}-${step.title}`} className="rounded-2xl border border-[var(--color-border)] p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                            Крок {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                process_steps: current.process_steps
                                  .filter((_, itemIndex) => itemIndex !== index)
                                  .map((item, itemIndex) => ({ ...item, step: itemIndex + 1 })),
                              }))
                            }
                            className="text-[var(--color-text-secondary)]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            value={step.title}
                            onChange={(event) => updateStep(index, { title: event.target.value })}
                            className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                            placeholder="Назва етапу"
                          />
                          <input
                            value={step.description}
                            onChange={(event) => updateStep(index, { description: event.target.value })}
                            className="rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                            placeholder="Пояснення"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">Іконка</span>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setField("icon", icon)}
                        className={`rounded-2xl border px-3 py-2 text-lg ${
                          form.icon === icon
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                            : "border-[var(--color-border)] bg-white"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">Категорія</span>
                  <div className="grid gap-2">
                    {CATEGORIES.map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setField("category", category.value)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                          form.category === category.value
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                            : "border-[var(--color-border)] bg-white text-[var(--color-text-primary)]"
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Ціна від</span>
                    <input
                      value={form.price_from}
                      onChange={(event) => setField("price_from", event.target.value)}
                      type="number"
                      min="0"
                      className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Одиниця</span>
                    <input
                      value={form.price_unit}
                      onChange={(event) => setField("price_unit", event.target.value)}
                      className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Термін від</span>
                    <input
                      value={form.duration_days_from}
                      onChange={(event) => setField("duration_days_from", event.target.value)}
                      type="number"
                      min="1"
                      className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Термін до</span>
                    <input
                      value={form.duration_days_to}
                      onChange={(event) => setField("duration_days_to", event.target.value)}
                      type="number"
                      min="1"
                      className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>

                  <label className="space-y-1.5 md:col-span-2">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Порядок</span>
                    <input
                      value={form.sort_order}
                      onChange={(event) => setField("sort_order", Number(event.target.value) || 0)}
                      type="number"
                      min="0"
                      className="w-full rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </label>
                </div>

                <div className="rounded-[24px] border border-[var(--color-border)] bg-white p-4">
                  <label className="flex items-center justify-between py-1">
                    <span className="text-sm text-[var(--color-text-primary)]">Активний сервіс</span>
                    <input
                      checked={form.is_active}
                      onChange={(event) => setField("is_active", event.target.checked)}
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

                <div className="space-y-3 rounded-[24px] border border-[var(--color-border)] bg-white p-4">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">SEO</h3>
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

            <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] bg-white px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-[var(--color-border)] px-5 py-3 text-sm"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Збереження..." : form.id ? "Зберегти зміни" : "Створити сервіс"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
