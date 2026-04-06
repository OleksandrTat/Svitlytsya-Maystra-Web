"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  GripVertical,
  HelpCircle,
  Languages,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  upsertFaqItemAction,
  deleteFaqItemAction,
  updateFaqSortOrderAction,
  updateFaqCategoryOrderAction,
} from "@/actions/admin/faq";
import { ConfirmDeleteButton } from "@/components/admin/shared/confirm-delete-button";
import type { FaqItem } from "@/lib/types";
import type { FaqCategoryLabels, FaqCategoryOrder } from "@/lib/data/faq-queries";
import { cn } from "@/lib/utils";

// ─── Categories ───────────────────────────────────────────────────────────────

const KNOWN_CATEGORIES: Record<string, { label: string; color: string }> = {
  general:    { label: "Загальні питання",           color: "bg-blue-100 text-blue-700" },
  production: { label: "Виробництво",                color: "bg-amber-100 text-amber-700" },
  delivery:   { label: "Доставка та монтаж",         color: "bg-green-100 text-green-700" },
  warranty:   { label: "Гарантія та обслуговування", color: "bg-purple-100 text-purple-700" },
  payment:    { label: "Оплата",                     color: "bg-rose-100 text-rose-700" },
};

const FALLBACK_COLORS = [
  "bg-sky-100 text-sky-700",
  "bg-teal-100 text-teal-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
  "bg-pink-100 text-pink-700",
  "bg-lime-100 text-lime-700",
];

function getCatMeta(val: string, allCategories: string[]) {
  if (KNOWN_CATEGORIES[val]) return KNOWN_CATEGORIES[val]!;
  const idx = allCategories.indexOf(val);
  return {
    label: val.charAt(0).toUpperCase() + val.slice(1),
    color: FALLBACK_COLORS[idx % FALLBACK_COLORS.length] ?? "bg-gray-100 text-gray-600",
  };
}

// ─── Bulk AI translate ────────────────────────────────────────────────────────

type BulkTranslateState =
  | { phase: "idle" }
  | { phase: "confirm"; count: number }
  | { phase: "running"; done: number; total: number; currentQuestion: string }
  | { phase: "done"; translated: number; skipped: number };

async function translateOneItem(id: string, question: string, answer: string): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "faq_items", id, fields: { question, answer } }),
    });
    const data = (await res.json()) as { ok?: boolean };
    return res.ok && !!data.ok;
  } catch {
    return false;
  }
}

function BulkTranslateModal({
  state,
  onConfirm,
  onClose,
}: {
  state: BulkTranslateState;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (state.phase === "idle") return null;

  const percent =
    state.phase === "running" && state.total > 0
      ? Math.round((state.done / state.total) * 100)
      : state.phase === "done"
        ? 100
        : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={state.phase === "confirm" || state.phase === "done" ? onClose : undefined} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
        {/* Icon */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {state.phase === "done" ? "Переклад завершено" : "AI переклад FAQ"}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">GPT-4o-mini · uk → en</p>
          </div>
          {(state.phase === "confirm" || state.phase === "done") && (
            <button type="button" onClick={onClose} className="ml-auto rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-section)]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Confirm */}
        {state.phase === "confirm" && (
          <>
            <p className="mb-2 text-sm text-[var(--color-text-primary)]">
              Буде перекладено <strong>{state.count}</strong> {state.count === 1 ? "питання" : state.count < 5 ? "питання" : "питань"} без англійського перекладу.
            </p>
            <p className="mb-5 text-xs text-[var(--color-text-muted)]">
              ШІ автоматично перекладе питання та відповіді на англійську. Наявні переклади залишаться без змін.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={onConfirm}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                <Sparkles className="h-4 w-4" />
                Перекласти {state.count} {state.count < 5 ? "питання" : "питань"}
              </button>
              <button type="button" onClick={onClose}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]">
                Скасувати
              </button>
            </div>
          </>
        )}

        {/* Running */}
        {state.phase === "running" && (
          <>
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-[var(--color-text-secondary)]">Перекладається {state.done + 1} з {state.total}…</span>
                <span className="font-semibold text-blue-600">{percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-section)]">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
            <p className="flex items-center gap-2 truncate text-xs text-[var(--color-text-muted)]">
              <Loader2 className="h-3 w-3 shrink-0 animate-spin text-blue-500" />
              {state.currentQuestion}
            </p>
            <p className="mt-3 text-center text-[10px] text-[var(--color-text-muted)]">Не закривайте сторінку</p>
          </>
        )}

        {/* Done */}
        {state.phase === "done" && (
          <>
            <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              ✅ Перекладено <strong>{state.translated}</strong> питань
              {state.skipped > 0 && <span className="text-emerald-600"> · {state.skipped} пропущено (помилка)</span>}
            </div>
            <button type="button" onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]">
              Оновити сторінку
            </button>
          </>
        )}
      </div>
    </>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

type DrawerProps = {
  item: FaqItem | null;
  totalItems: number;
  allCategories: string[];
  customLabels: FaqCategoryLabels;
  onClose: () => void;
  onSubmit: (fd: FormData) => void;
  isPending: boolean;
};

function CategoryCombobox({ allCategories, defaultValue, knownCategories, customLabels }: {
  allCategories: string[];
  defaultValue: string;
  knownCategories: Record<string, { label: string; color: string }>;
  customLabels: FaqCategoryLabels;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useState<HTMLDivElement | null>(null);

  const isNew = value.trim() !== "" && !allCategories.includes(value.trim());

  const getLabel = (cat: string) =>
    knownCategories[cat]?.label ?? customLabels[cat]?.uk ?? customLabels[cat]?.en ?? cat;

  const suggestions = allCategories.filter((cat) => {
    if (!query) return true;
    const label = getLabel(cat);
    return (
      cat.toLowerCase().includes(query.toLowerCase()) ||
      label.toLowerCase().includes(query.toLowerCase())
    );
  });

  const selectCat = (cat: string) => {
    setValue(cat);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={(el) => { (containerRef as unknown as React.MutableRefObject<HTMLDivElement | null>).current = el; }}>
      <input type="hidden" name="category" value={value} />
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition",
          open
            ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20"
            : "border-[var(--color-border)]",
        )}
      >
        {/* Selected badge or input */}
        {!open && value ? (
          <button
            type="button"
            onClick={() => { setQuery(""); setOpen(true); }}
            className="flex flex-1 items-center gap-1.5 text-left"
          >
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", knownCategories[value]?.color ?? "bg-gray-100 text-gray-600")}>
              {getLabel(value)}
            </span>
            {isNew && <span className="text-[10px] text-amber-600">нова</span>}
            <ChevronDown className="ml-auto h-3.5 w-3.5 text-[var(--color-text-muted)]" />
          </button>
        ) : (
          <input
            autoFocus={open}
            type="text"
            placeholder="Пошук або нова категорія..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setValue(e.target.value); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="flex-1 bg-transparent outline-none placeholder:text-[var(--color-text-muted)]"
          />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-52 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-white shadow-lg">
          {suggestions.length > 0 ? (
            suggestions.map((cat) => {
              const meta = knownCategories[cat] ?? { label: getLabel(cat), color: "bg-gray-100 text-gray-600" };
              return (
                <button
                  key={cat}
                  type="button"
                  onMouseDown={() => selectCat(cat)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--color-bg-section)]"
                >
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", meta.color)}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{cat}</span>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2.5 text-sm text-[var(--color-text-muted)]">
              Натисніть Enter щоб створити &ldquo;<strong>{query}</strong>&rdquo;
            </div>
          )}

          {/* Create new option */}
          {query && !allCategories.includes(query) && (
            <button
              type="button"
              onMouseDown={() => selectCat(query)}
              className="flex w-full items-center gap-2 border-t border-[var(--color-border)] px-3 py-2.5 text-left text-sm text-[var(--color-primary)] hover:bg-[var(--color-bg-section)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Створити категорію &ldquo;{query}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FaqDrawer({ item, totalItems, allCategories, customLabels, onClose, onSubmit, isPending }: DrawerProps) {
  const [showEn, setShowEn] = useState(!!item?.question_en);
  const [question, setQuestion] = useState(item?.question ?? "");
  const [answer, setAnswer] = useState(item?.answer ?? "");
  const [questionEn, setQuestionEn] = useState(item?.question_en ?? "");
  const [answerEn, setAnswerEn] = useState(item?.answer_en ?? "");
  const [isTranslating, setIsTranslating] = useState(false);
  const catIsNew = item?.category ? !Object.keys(KNOWN_CATEGORIES).includes(item.category) : false;
  const [showCatLabels, setShowCatLabels] = useState(catIsNew);

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
      if (!res.ok || !data.translations) {
        toast.error(data.error ?? "Помилка перекладу");
        return;
      }
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

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[var(--color-primary)]" />
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              {item ? "Редагувати питання" : "Нове питання"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-section)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={onSubmit} className="flex flex-1 flex-col overflow-y-auto">
          {item && <input type="hidden" name="id" value={item.id} />}

          <div className="flex-1 space-y-5 px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Категорія
                </label>
                <CategoryCombobox
                  allCategories={allCategories}
                  defaultValue={item?.category ?? "general"}
                  knownCategories={KNOWN_CATEGORIES}
                  customLabels={customLabels}
                />
                <button
                  type="button"
                  onClick={() => setShowCatLabels((v) => !v)}
                  className="mt-1.5 flex items-center gap-1 text-[10px] text-[var(--color-primary)] hover:underline"
                >
                  <Languages className="h-3 w-3" />
                  {showCatLabels ? "Приховати назви" : "Задати назви категорії (uk/en)"}
                </button>
                {showCatLabels && (
                  <div className="mt-2 space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-section)] p-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-[var(--color-text-muted)]">Назва 🇺🇦</label>
                      <input name="category_label_uk" type="text" placeholder="напр. Монтаж"
                        defaultValue={item?.category ? KNOWN_CATEGORIES[item.category]?.label ?? "" : ""}
                        className="w-full rounded-md border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-medium text-[var(--color-text-muted)]">Label 🇬🇧</label>
                      <input name="category_label_en" type="text" placeholder="e.g. Installation"
                        className="w-full rounded-md border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      Назви будуть збережені і відображатимуться на сайті.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  Порядок
                </label>
                <input
                  type="number"
                  name="sort_order"
                  min={0}
                  defaultValue={item?.sort_order ?? totalItems * 10}
                  key={item?.id ?? "new-sort"}
                  className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  name="is_published_check"
                  defaultChecked={item?.is_published ?? true}
                  key={item?.id ?? "new-pub"}
                  onChange={(e) => {
                    const hidden = e.target.form?.querySelector('input[name="is_published"]') as HTMLInputElement;
                    if (hidden) hidden.value = e.target.checked ? "true" : "false";
                  }}
                  className="peer sr-only"
                />
                <input type="hidden" name="is_published" defaultValue={item?.is_published !== false ? "true" : "false"} key={item?.id ?? "new-pubh"} />
                <div className="h-5 w-9 rounded-full bg-[var(--color-border)] transition peer-checked:bg-[var(--color-primary)]" />
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
              </div>
              <span className="text-sm text-[var(--color-text-secondary)]">Опубліковано</span>
            </label>

            <hr className="border-[var(--color-border)]" />

            {/* Ukrainian fields */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">🇺🇦 Українська</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                    Питання <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="question"
                    required
                    rows={2}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Введіть питання..."
                    className="w-full resize-none rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                    Відповідь <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="answer"
                    required
                    rows={5}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Введіть відповідь..."
                    className="w-full resize-y rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  />
                </div>
              </div>
            </div>

            {/* English section */}
            <div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowEn((v) => !v)}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] hover:underline"
                >
                  <Languages className="h-3.5 w-3.5" />
                  🇬🇧 English переклад
                  {showEn ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>

                {/* AI translate button — works for both new and existing items */}
                <button
                  type="button"
                  onClick={() => void handleAutoTranslate()}
                  disabled={!canTranslate || isTranslating}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    canTranslate
                      ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                      : "cursor-not-allowed bg-[var(--color-bg-section)] text-[var(--color-text-muted)]",
                  )}
                >
                  {isTranslating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {isTranslating ? "Перекладаю…" : "Перекласти ШІ"}
                </button>
              </div>

              {showEn && (
                <div className="mt-3 space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Question (EN)</label>
                    <textarea
                      name="question_en"
                      rows={2}
                      value={questionEn}
                      onChange={(e) => setQuestionEn(e.target.value)}
                      placeholder="Enter question in English..."
                      className="w-full resize-none rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Answer (EN)</label>
                    <textarea
                      name="answer_en"
                      rows={5}
                      value={answerEn}
                      onChange={(e) => setAnswerEn(e.target.value)}
                      placeholder="Enter answer in English..."
                      className="w-full resize-y rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] px-6 py-4">
            <div className="flex gap-3">
              <button type="submit" disabled={isPending}
                className="flex-1 rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-50">
                {isPending ? "Збереження..." : item ? "Зберегти зміни" : "Додати питання"}
              </button>
              <button type="button" onClick={onClose}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]">
                Скасувати
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Sortable Row ─────────────────────────────────────────────────────────────

type RowProps = {
  item: FaqItem;
  allCategories: string[];
  onEdit: () => void;
  onDelete: (fd: FormData) => void;
};

function SortableFaqRow({ item, allCategories, onEdit, onDelete }: RowProps) {
  const [expanded, setExpanded] = useState(false);
  const cat = getCatMeta(item.category, allCategories);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group border-b border-[var(--color-border)] last:border-0 bg-white",
        isDragging && "z-50 rounded-xl shadow-lg opacity-95",
        !item.is_published && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3 px-5 py-4">
        {/* Item drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none rounded p-1 text-[var(--color-text-muted)] opacity-30 transition hover:bg-[var(--color-bg-section)] hover:opacity-100 active:cursor-grabbing group-hover:opacity-60"
          aria-label="Перетягнути"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", cat.color)}>
              {cat.label}
            </span>
            {!item.is_published && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Чернетка</span>
            )}
            {item.question_en && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">EN ✓</span>
            )}
          </div>
          <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1.5 w-full text-left">
            <p className="text-sm font-medium leading-snug text-[var(--color-text-primary)]">
              {item.question}
            </p>
            {expanded && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {item.answer}
              </p>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button type="button" onClick={onEdit}
            className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-section)] hover:text-[var(--color-primary)]"
            title="Редагувати">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <form action={onDelete}>
            <input type="hidden" name="id" value={item.id} />
            <ConfirmDeleteButton label="" pendingLabel=""
              className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600" />
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Sortable Category Block ──────────────────────────────────────────────────

type CategoryBlockProps = {
  catVal: string;
  catItems: FaqItem[];
  allCategories: string[];
  onEdit: (item: FaqItem) => void;
  onDelete: (fd: FormData) => void;
  onItemDragEnd: (event: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;
};

function SortableCategoryBlock({
  catVal,
  catItems,
  allCategories,
  onEdit,
  onDelete,
  onItemDragEnd,
  sensors,
}: CategoryBlockProps) {
  const meta = getCatMeta(catVal, allCategories);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `cat::${catVal}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--color-border)] bg-white transition",
        isDragging && "shadow-2xl opacity-95 ring-2 ring-[var(--color-primary)]/30",
      )}
    >
      {/* Category header with drag handle */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded p-1 text-[var(--color-text-muted)] opacity-40 transition hover:bg-[var(--color-bg-section)] hover:opacity-100 active:cursor-grabbing"
          aria-label="Перетягнути категорію"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", meta.color)}>
          {meta.label}
        </span>
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">{catItems.length} питань</span>
      </div>

      {/* Items with their own DnD context */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onItemDragEnd}>
        <SortableContext items={catItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {catItems.map((item) => (
            <SortableFaqRow
              key={item.id}
              item={item}
              allCategories={allCategories}
              onEdit={() => onEdit(item)}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function FaqAdminClient({
  items: initial,
  customLabels,
  savedCategoryOrder,
}: {
  items: FaqItem[];
  customLabels: FaqCategoryLabels;
  savedCategoryOrder: FaqCategoryOrder;
}) {
  const [items, setItems] = useState(initial);
  const [editItem, setEditItem] = useState<FaqItem | null | "new">(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [bulkState, setBulkState] = useState<BulkTranslateState>({ phase: "idle" });
  const abortRef = useRef(false);

  const drawerOpen = editItem !== null;
  const drawerItem = editItem === "new" ? null : editItem;

  // Sensors with 5px activation distance to avoid accidental drag on click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // All unique categories from data
  const allCategories = useMemo(() => {
    const fromData = Array.from(new Set(items.map((i) => i.category)));
    const knownKeys = Object.keys(KNOWN_CATEGORIES);
    const known = knownKeys.filter((k) => fromData.includes(k));
    const custom = fromData.filter((k) => !knownKeys.includes(k));
    return [...known, ...custom];
  }, [items]);

  // Category order state — initialized from saved order, unknown categories appended
  const [categoryOrder, setCategoryOrder] = useState<string[]>(() => {
    const saved = savedCategoryOrder.filter((c) => allCategories.includes(c));
    const rest = allCategories.filter((c) => !saved.includes(c));
    return [...saved, ...rest];
  });

  // Ordered categories for rendering (respects categoryOrder, appends any new ones)
  const orderedCategories = useMemo(() => {
    const inOrder = categoryOrder.filter((c) => allCategories.includes(c));
    const rest = allCategories.filter((c) => !inOrder.includes(c));
    return [...inOrder, ...rest];
  }, [categoryOrder, allCategories]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCat = filterCat === "all" || item.category === filterCat;
      const q = search.toLowerCase();
      const matchSearch = !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [items, search, filterCat]);

  const grouped = useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    for (const cat of orderedCategories) map.set(cat, []);
    for (const item of filtered) {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return map;
  }, [filtered, orderedCategories]);

  // Item drag & drop within a category
  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, i) => ({
      ...item,
      sort_order: i * 10,
    }));
    setItems(reordered);

    startTransition(async () => {
      const result = await updateFaqSortOrderAction(
        reordered.map((item) => ({ id: item.id, sort_order: item.sort_order })),
      );
      if (!result.ok) toast.error(result.message);
    });
  };

  // Category drag & drop
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // IDs are prefixed with "cat::" to avoid collisions with item IDs
    const activeId = String(active.id).replace("cat::", "");
    const overId = String(over.id).replace("cat::", "");

    const oldIndex = orderedCategories.indexOf(activeId);
    const newIndex = orderedCategories.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(orderedCategories, oldIndex, newIndex);
    setCategoryOrder(newOrder);

    startTransition(async () => {
      const result = await updateFaqCategoryOrderAction(newOrder);
      if (!result.ok) toast.error(result.message);
      else toast.success("Порядок категорій збережено");
    });
  };

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await upsertFaqItemAction(formData);
      if (result.ok) {
        toast.success(result.message);
        setEditItem(null);
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = (formData: FormData) => {
    startTransition(async () => {
      const result = await deleteFaqItemAction(formData);
      if (result.ok) {
        toast.success(result.message);
        const id = formData.get("id");
        setItems((prev) => prev.filter((i) => i.id !== id));
      } else {
        toast.error(result.message);
      }
    });
  };

  // ── Bulk AI translate ──────────────────────────────────────────────────────
  const untranslated = useMemo(() => items.filter((i) => !i.question_en || !i.answer_en), [items]);

  const handleBulkTranslateClick = () => {
    if (untranslated.length === 0) {
      toast.info("Усі питання вже перекладені 🎉");
      return;
    }
    setBulkState({ phase: "confirm", count: untranslated.length });
  };

  const handleBulkTranslateConfirm = async () => {
    abortRef.current = false;
    const toTranslate = untranslated;
    let translated = 0;
    let skipped = 0;

    for (let i = 0; i < toTranslate.length; i++) {
      if (abortRef.current) break;
      const item = toTranslate[i]!;
      setBulkState({
        phase: "running",
        done: i,
        total: toTranslate.length,
        currentQuestion: item.question,
      });
      const ok = await translateOneItem(item.id, item.question, item.answer);
      if (ok) translated++;
      else skipped++;
    }

    setBulkState({ phase: "done", translated, skipped });
  };

  const handleBulkClose = () => {
    abortRef.current = true;
    setBulkState({ phase: "idle" });
  };

  return (
    <>
      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input type="text" placeholder="Пошук..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-white py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none">
            <option value="all">Всі категорії</option>
            {orderedCategories.map((catVal) => (
              <option key={catVal} value={catVal}>{getCatMeta(catVal, allCategories).label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleBulkTranslateClick()}
            title={untranslated.length === 0 ? "Всі перекладені" : `${untranslated.length} без EN перекладу`}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
              untranslated.length > 0
                ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] opacity-60",
            )}
          >
            <Sparkles className="h-4 w-4" />
            EN переклад
            {untranslated.length > 0 && (
              <span className="rounded-full bg-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                {untranslated.length}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setEditItem("new")}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]">
            <Plus className="h-4 w-4" />
            Нове питання
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        {orderedCategories.map((catVal) => {
          const count = items.filter((i) => i.category === catVal).length;
          if (!count) return null;
          const meta = getCatMeta(catVal, allCategories);
          return (
            <button key={catVal} type="button"
              onClick={() => setFilterCat(filterCat === catVal ? "all" : catVal)}
              className={cn("rounded-full px-3 py-1 text-xs font-semibold transition", meta.color, filterCat === catVal && "ring-2 ring-current ring-offset-1")}>
              {meta.label} · {count}
            </button>
          );
        })}
        <span className="ml-auto self-center text-xs text-[var(--color-text-muted)]">
          {filtered.length} з {items.length}
        </span>
      </div>

      {/* Hint */}
      {orderedCategories.length > 1 && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <GripVertical className="h-3.5 w-3.5" />
          Перетягуйте категорії та питання для зміни порядку
        </p>
      )}

      {/* Outer DndContext — category reordering */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleCategoryDragEnd}
      >
        <SortableContext
          items={orderedCategories.map((c) => `cat::${c}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {orderedCategories.map((catVal) => {
              const catItems = grouped.get(catVal) ?? [];
              if (catItems.length === 0) return null;

              return (
                <SortableCategoryBlock
                  key={catVal}
                  catVal={catVal}
                  catItems={catItems}
                  allCategories={allCategories}
                  onEdit={setEditItem}
                  onDelete={handleDelete}
                  onItemDragEnd={handleItemDragEnd}
                  sensors={sensors}
                />
              );
            })}

            {filtered.length === 0 && (
              <div className="rounded-xl border border-[var(--color-border)] bg-white px-5 py-16 text-center">
                <HelpCircle className="mx-auto mb-3 h-8 w-8 text-[var(--color-text-muted)]" />
                <p className="text-sm text-[var(--color-text-muted)]">
                  {search || filterCat !== "all" ? "Нічого не знайдено" : "Немає FAQ записів"}
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Drawer */}
      {drawerOpen && (
        <FaqDrawer
          item={drawerItem}
          totalItems={items.length}
          allCategories={allCategories}
          customLabels={customLabels}
          onClose={() => setEditItem(null)}
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      )}

      {/* Bulk translate modal */}
      <BulkTranslateModal
        state={bulkState}
        onConfirm={() => void handleBulkTranslateConfirm()}
        onClose={handleBulkClose}
      />
    </>
  );
}
