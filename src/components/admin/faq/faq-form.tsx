"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  Languages,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { upsertFaqItemAction } from "@/actions/admin/faq";
import { CategoryCombobox, type CategoryLabels } from "@/components/admin/shared/category-combobox";
import type { FaqItem } from "@/lib/types";
import type { FaqCategoryLabels } from "@/lib/data/faq-queries";
import { cn } from "@/lib/utils";

type Props = {
  initialData?: FaqItem | null;
  allCategories: string[];
  totalItems: number;
  customLabels: FaqCategoryLabels;
};

export function FaqForm({ initialData, allCategories, totalItems, customLabels }: Props) {
  const router = useRouter();
  const isEdit = Boolean(initialData?.id);
  const [pending, startTransition] = useTransition();

  const [question, setQuestion] = useState(initialData?.question ?? "");
  const [answer, setAnswer] = useState(initialData?.answer ?? "");
  const [questionEn, setQuestionEn] = useState(initialData?.question_en ?? "");
  const [answerEn, setAnswerEn] = useState(initialData?.answer_en ?? "");
  const [isPublished, setIsPublished] = useState(initialData?.is_published ?? true);
  const [showEn, setShowEn] = useState(Boolean(initialData?.question_en));
  const [isTranslating, setIsTranslating] = useState(false);
  const [catValue, setCatValue] = useState(initialData?.category ?? "general");
  const [catLabels, setCatLabels] = useState<CategoryLabels>(customLabels as CategoryLabels);

  const canTranslate = question.trim().length > 3 || answer.trim().length > 3;

  const handleAutoTranslate = async () => {
    if (!canTranslate) return;
    setIsTranslating(true);
    try {
      const res = await fetch("/api/admin/translate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: [question, answer] }),
      });
      const data = (await res.json()) as { translations?: string[]; error?: string };
      if (!res.ok || !data.translations) { toast.error(data.error ?? "Помилка перекладу"); return; }
      setQuestionEn(data.translations[0] ?? "");
      setAnswerEn(data.translations[1] ?? "");
      setShowEn(true);
      toast.success("Переклад готовий ✓");
    } catch {
      toast.error("Не вдалося перекласти");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await upsertFaqItemAction(formData);
      if (!result.ok) { toast.error(result.message); return; }
      toast.success(result.message);
      router.push("/admin/faq");
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <form id="faq-form" action={handleSubmit} className="space-y-5">
        {initialData && <input type="hidden" name="id" value={initialData.id} />}
        <input type="hidden" name="is_published" value={isPublished ? "true" : "false"} />

          {/* Meta card */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-5 py-3">
              <p className="text-sm font-semibold text-zinc-900">Налаштування</p>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Категорія</label>
                <CategoryCombobox
                  value={catValue}
                  onChange={setCatValue}
                  allCategories={allCategories}
                  labels={catLabels}
                  onLabelsChange={setCatLabels}
                  name="category"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Порядок</label>
                <input type="number" name="sort_order" min={0}
                  defaultValue={initialData?.sort_order ?? totalItems * 10}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]" />
              </div>
              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-3">
                  <div className="relative">
                    <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="peer sr-only" />
                    <div className="h-5 w-9 rounded-full bg-zinc-200 transition peer-checked:bg-[var(--color-primary)]" />
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-zinc-600">Опубліковано</span>
                </label>
              </div>
            </div>
          </div>

          {/* Ukrainian */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-5 py-3">
              <p className="text-sm font-semibold text-zinc-900">🇺🇦 Українська</p>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  Питання <span className="text-red-400">*</span>
                </label>
                <textarea name="question" required rows={2} value={question} onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Введіть питання..."
                  className="w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  Відповідь <span className="text-red-400">*</span>
                </label>
                <textarea name="answer" required rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Введіть відповідь..."
                  className="w-full resize-y rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10" />
              </div>
            </div>
          </div>

          {/* English */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
              <button type="button" onClick={() => setShowEn((v) => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900">
                <Languages className="h-4 w-4 text-[var(--color-primary)]" />
                🇬🇧 English переклад
                {showEn ? <ChevronUp className="h-3.5 w-3.5 text-zinc-400" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />}
              </button>
              <button type="button" onClick={() => void handleAutoTranslate()} disabled={!canTranslate || isTranslating}
                className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  canTranslate ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" : "cursor-not-allowed bg-zinc-100 text-zinc-400")}>
                {isTranslating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {isTranslating ? "Перекладаю…" : "Перекласти ШІ"}
              </button>
            </div>
            {showEn && (
              <div className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Question (EN)</label>
                  <textarea name="question_en" rows={2} value={questionEn} onChange={(e) => setQuestionEn(e.target.value)}
                    placeholder="Enter question in English..."
                    className="w-full resize-none rounded-xl border border-blue-200 bg-blue-50/30 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-zinc-400">Answer (EN)</label>
                  <textarea name="answer_en" rows={6} value={answerEn} onChange={(e) => setAnswerEn(e.target.value)}
                    placeholder="Enter answer in English..."
                    className="w-full resize-y rounded-xl border border-blue-200 bg-blue-50/30 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom submit */}
          <div className="flex justify-end">
            <button type="submit" disabled={pending}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-700)] disabled:opacity-50">
              {pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {isEdit ? "Зберегти зміни" : "Додати питання"}
            </button>
          </div>
        </form>
    </div>
  );
}
