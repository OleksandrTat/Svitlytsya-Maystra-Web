"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Globe, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { upsertCertificateAction, deleteCertificateAction } from "@/actions/admin/certificates";
import { CoverImageUpload } from "@/components/admin/shared/cover-image-upload";
import { cn } from "@/lib/utils";
import type { Certificate } from "@/lib/types";

type Props = { initialData?: Certificate; totalItems?: number };

type Tab = "uk" | "en" | "seo";

const inputCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-shadow";

const textareaCls = cn(inputCls, "resize-none");

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          {title}
        </p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

const TABS: { id: Tab; label: string; flag?: string }[] = [
  { id: "uk", label: "Українська", flag: "🇺🇦" },
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "seo", label: "SEO" },
];

export function CertificateForm({ initialData, totalItems = 0 }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("uk");
  const [imageUrl, setImageUrl] = useState(initialData?.image_url ?? "");
  const [isPublished, setIsPublished] = useState(initialData?.is_published ?? true);

  const isEditing = Boolean(initialData);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("image_url", imageUrl);
    fd.set("is_published", isPublished ? "true" : "false");

    startTransition(async () => {
      const result = await upsertCertificateAction(fd);
      if (result.ok) {
        toast.success(result.message);
        router.push("/admin/certificates");
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = () => {
    if (!initialData || !confirm("Видалити цей сертифікат? Дію не можна скасувати.")) return;
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.set("id", initialData.id);
      const result = await deleteCertificateAction(fd);
      if (result.ok) {
        toast.success(result.message);
        router.push("/admin/certificates");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg-section)]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--color-border)] bg-white px-5 py-3.5 shadow-sm">
        <button
          type="button"
          onClick={() => router.push("/admin/certificates")}
          className="flex items-center gap-1.5 rounded-xl p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-section)] hover:text-[var(--color-text-secondary)]"
        >
          <ArrowLeft size={17} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-display text-base font-semibold text-[var(--color-text-primary)]">
            {isEditing ? initialData!.title : "Новий сертифікат"}
          </h1>
          {isEditing && (
            <p className="text-xs text-[var(--color-text-muted)]">{initialData!.issuer}</p>
          )}
        </div>

        {/* Published toggle */}
        <button
          type="button"
          onClick={() => setIsPublished((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
            isPublished
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200",
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", isPublished ? "bg-emerald-500" : "bg-amber-400")} />
          {isPublished ? "Опубліковано" : "Чернетка"}
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Lang tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] bg-white px-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)] -mb-px"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
            )}
          >
            {tab.flag && <span>{tab.flag}</span>}
            {tab.id === "seo" && <Globe size={13} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="flex-1">
        {initialData && <input type="hidden" name="id" value={initialData.id} />}

        <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
          <AnimatePresence mode="wait">
            {/* ── Ukrainian tab ─────────────────────────── */}
            {activeTab === "uk" && (
              <motion.div
                key="uk"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-5"
              >
                <Section title="Основна інформація">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Назва *">
                      <input
                        name="title"
                        required
                        defaultValue={initialData?.title ?? ""}
                        placeholder="Сертифікат ISO 9001"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Видавець *">
                      <input
                        name="issuer"
                        required
                        defaultValue={initialData?.issuer ?? ""}
                        placeholder="Bureau Veritas"
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <Field label="Опис">
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={initialData?.description ?? ""}
                      placeholder="Коротко про що цей сертифікат…"
                      className={textareaCls}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Рік видачі">
                      <input
                        name="issued_year"
                        type="number"
                        min={1990}
                        max={2040}
                        defaultValue={initialData?.issued_year ?? ""}
                        placeholder="2024"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Порядок сортування">
                      <input
                        name="sort_order"
                        type="number"
                        min={0}
                        defaultValue={initialData?.sort_order ?? totalItems}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </Section>

                <Section title="Зображення сертифікату">
                  <CoverImageUpload
                    value={imageUrl}
                    onChange={setImageUrl}
                    bucket="certificate-images"
                    folder="certificates"
                    aspectRatio="4/3"
                  />
                </Section>
              </motion.div>
            )}

            {/* ── English tab ───────────────────────────── */}
            {activeTab === "en" && (
              <motion.div
                key="en"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                <Section title="English Content">
                  <Field label="Title (EN)" hint="Leave blank to use the Ukrainian title">
                    <input
                      name="title_en"
                      defaultValue={initialData?.title_en ?? ""}
                      placeholder="ISO 9001 Certificate"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Issuer (EN)" hint="Leave blank to use the Ukrainian issuer">
                    <input
                      name="issuer_en"
                      defaultValue={initialData?.issuer_en ?? ""}
                      placeholder="Bureau Veritas"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Description (EN)">
                    <textarea
                      name="description_en"
                      rows={4}
                      defaultValue={initialData?.description_en ?? ""}
                      placeholder="Brief description of this certificate…"
                      className={textareaCls}
                    />
                  </Field>
                </Section>
              </motion.div>
            )}

            {/* ── SEO tab ───────────────────────────────── */}
            {activeTab === "seo" && (
              <motion.div
                key="seo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-5"
              >
                <Section title="SEO — Українська 🇺🇦">
                  <Field label="Meta Title" hint="Рекомендовано: до 60 символів">
                    <input
                      name="seo_title"
                      defaultValue={initialData?.seo_title ?? ""}
                      placeholder={initialData?.title ?? "Назва для пошукових систем"}
                      className={inputCls}
                      maxLength={80}
                    />
                  </Field>
                  <Field label="Meta Description" hint="Рекомендовано: 120–160 символів">
                    <textarea
                      name="seo_description"
                      rows={3}
                      defaultValue={initialData?.seo_description ?? ""}
                      placeholder="Опис сторінки для Google…"
                      className={textareaCls}
                      maxLength={200}
                    />
                  </Field>
                </Section>

                <Section title="SEO — English 🇬🇧">
                  <Field label="Meta Title (EN)" hint="Recommended: up to 60 characters">
                    <input
                      name="seo_title_en"
                      defaultValue={initialData?.seo_title_en ?? ""}
                      placeholder={initialData?.title_en ?? initialData?.title ?? "Page title for search engines"}
                      className={inputCls}
                      maxLength={80}
                    />
                  </Field>
                  <Field label="Meta Description (EN)" hint="Recommended: 120–160 characters">
                    <textarea
                      name="seo_description_en"
                      rows={3}
                      defaultValue={initialData?.seo_description_en ?? ""}
                      placeholder="Page description for Google…"
                      className={textareaCls}
                      maxLength={200}
                    />
                  </Field>
                </Section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-700)] disabled:opacity-50"
            >
              <Save size={14} />
              {isPending ? "Збереження…" : isEditing ? "Зберегти зміни" : "Створити"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/certificates")}
              className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm transition hover:bg-[var(--color-bg-section)]"
            >
              Скасувати
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
