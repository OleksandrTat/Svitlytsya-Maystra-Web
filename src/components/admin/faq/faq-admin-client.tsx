"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  GripVertical,
  HelpCircle,
  Languages,
  Plus,
  Search,
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
} from "@/actions/admin/faq";
import { ConfirmDeleteButton } from "@/components/admin/shared/confirm-delete-button";
import { TranslateButton } from "@/components/admin/shared/translate-button";
import type { FaqItem } from "@/lib/types";
import type { FaqCategoryLabels } from "@/lib/data/faq-queries";
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
  const catIsNew = item?.category ? !Object.keys(KNOWN_CATEGORIES).includes(item.category) : false;
  const [showCatLabels, setShowCatLabels] = useState(catIsNew);

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
                {/* Labels for new category */}
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

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">🇺🇦 Українська</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                    Питання <span className="text-red-500">*</span>
                  </label>
                  <textarea name="question" required rows={2} defaultValue={item?.question ?? ""} key={item?.id ?? "new-q"} placeholder="Введіть питання..."
                    className="w-full resize-none rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                    Відповідь <span className="text-red-500">*</span>
                  </label>
                  <textarea name="answer" required rows={5} defaultValue={item?.answer ?? ""} key={item?.id ?? "new-a"} placeholder="Введіть відповідь..."
                    className="w-full resize-y rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
                </div>
              </div>
            </div>

            <div>
              <button type="button" onClick={() => setShowEn((v) => !v)}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] hover:underline">
                <Languages className="h-3.5 w-3.5" />
                🇬🇧 English переклад
                {showEn ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showEn && (
                <div className="mt-3 space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Question (EN)</label>
                    <textarea name="question_en" rows={2} defaultValue={item?.question_en ?? ""} key={item?.id ?? "new-qen"} placeholder="Enter question in English..."
                      className="w-full resize-none rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Answer (EN)</label>
                    <textarea name="answer_en" rows={5} defaultValue={item?.answer_en ?? ""} key={item?.id ?? "new-aen"} placeholder="Enter answer in English..."
                      className="w-full resize-y rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  {item && (
                    <div className="pt-1">
                      <TranslateButton table="faq_items" id={item.id} fields={{ question: item.question, answer: item.answer }} />
                    </div>
                  )}
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
        {/* Drag handle */}
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export function FaqAdminClient({ items: initial, customLabels }: { items: FaqItem[]; customLabels: FaqCategoryLabels }) {
  const [items, setItems] = useState(initial);
  const [editItem, setEditItem] = useState<FaqItem | null | "new">(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const drawerOpen = editItem !== null;
  const drawerItem = editItem === "new" ? null : editItem;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const allCategories = useMemo(() => {
    const fromData = Array.from(new Set(items.map((i) => i.category)));
    const knownKeys = Object.keys(KNOWN_CATEGORIES);
    const known = knownKeys.filter((k) => fromData.includes(k));
    const custom = fromData.filter((k) => !knownKeys.includes(k));
    return [...known, ...custom];
  }, [items]);

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
    for (const cat of allCategories) map.set(cat, []);
    for (const item of filtered) {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return map;
  }, [filtered, allCategories]);

  const handleDragEnd = (event: DragEndEvent) => {
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
            {allCategories.map((catVal) => (
              <option key={catVal} value={catVal}>{getCatMeta(catVal, allCategories).label}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={() => setEditItem("new")}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]">
          <Plus className="h-4 w-4" />
          Нове питання
        </button>
      </div>

      {/* Stats bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        {allCategories.map((catVal) => {
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

      {/* Grouped sortable list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          {allCategories.map((catVal) => {
            const catItems = grouped.get(catVal) ?? [];
            if (catItems.length === 0) return null;
            const meta = getCatMeta(catVal, allCategories);
            return (
              <div key={catVal} className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-2.5">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", meta.color)}>
                    {meta.label}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{catItems.length} питань</span>
                </div>
                <SortableContext items={catItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                  {catItems.map((item) => (
                    <SortableFaqRow
                      key={item.id}
                      item={item}
                      allCategories={allCategories}
                      onEdit={() => setEditItem(item)}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              </div>
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
    </>
  );
}
