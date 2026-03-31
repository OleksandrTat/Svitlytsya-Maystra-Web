"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  upsertFaqItemAction,
  deleteFaqItemAction,
  updateFaqSortOrderAction,
} from "@/actions/admin/faq";
import { ConfirmDeleteButton } from "@/components/admin/shared/confirm-delete-button";
import type { FaqItem } from "@/lib/types";

const CATEGORY_OPTIONS = [
  { value: "general", label: "Загальні питання" },
  { value: "production", label: "Виробництво" },
  { value: "delivery", label: "Доставка та монтаж" },
  { value: "warranty", label: "Гарантія та обслуговування" },
  { value: "payment", label: "Оплата" },
];

export function FaqAdminClient({ items: initial }: { items: FaqItem[] }) {
  const [items, setItems] = useState(initial);
  const [editItem, setEditItem] = useState<FaqItem | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const handleMove = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;

    [newItems[index], newItems[swapIndex]] = [
      newItems[swapIndex],
      newItems[index],
    ];

    const updated = newItems.map((item, i) => ({
      ...item,
      sort_order: i,
    }));
    setItems(updated);

    startTransition(async () => {
      const result = await updateFaqSortOrderAction(
        updated.map((item) => ({ id: item.id, sort_order: item.sort_order })),
      );
      if (!result.ok) toast.error(result.message);
    });
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
          {editItem ? "Редагувати FAQ" : "Додати FAQ"}
        </h3>
        <form action={handleSubmit} className="space-y-4">
          {editItem && <input type="hidden" name="id" value={editItem.id} />}

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
              Питання
            </label>
            <textarea
              name="question"
              required
              rows={2}
              defaultValue={editItem?.question ?? ""}
              key={editItem?.id ?? "new-q"}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
              Відповідь
            </label>
            <textarea
              name="answer"
              required
              rows={4}
              defaultValue={editItem?.answer ?? ""}
              key={editItem?.id ?? "new-a"}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Категорія
              </label>
              <select
                name="category"
                defaultValue={editItem?.category ?? "general"}
                key={editItem?.id ?? "new-c"}
                className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Порядок
              </label>
              <input
                type="number"
                name="sort_order"
                min={0}
                defaultValue={editItem?.sort_order ?? items.length}
                key={editItem?.id ?? "new-s"}
                className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="is_published_check"
                  defaultChecked={editItem?.is_published ?? true}
                  key={editItem?.id ?? "new-p"}
                  onChange={(e) => {
                    const hidden = e.target.form?.querySelector(
                      'input[name="is_published"]',
                    ) as HTMLInputElement;
                    if (hidden)
                      hidden.value = e.target.checked ? "true" : "false";
                  }}
                  className="rounded"
                />
                Опубліковано
              </label>
              <input
                type="hidden"
                name="is_published"
                defaultValue={
                  editItem?.is_published !== false ? "true" : "false"
                }
                key={editItem?.id ?? "new-ph"}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-50"
            >
              <Plus size={14} />
              {editItem ? "Оновити" : "Додати"}
            </button>
            {editItem && (
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm transition hover:bg-[var(--color-bg-warm)]"
              >
                Скасувати
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white">
        <div className="border-b border-[var(--color-border)] px-5 py-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Всього: {items.length}
          </h3>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="group flex items-start gap-4 px-5 py-4"
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMove(index, "up")}
                  className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-warm)] disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => handleMove(index, "down")}
                  className="rounded p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-warm)] disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {item.question}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">
                  {item.answer}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-[var(--color-bg-section)] px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                    {CATEGORY_OPTIONS.find((o) => o.value === item.category)
                      ?.label ?? item.category}
                  </span>
                  {!item.is_published && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                      Чернетка
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setEditItem(item)}
                  className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-warm)] hover:text-[var(--color-primary)]"
                  title="Редагувати"
                >
                  <Edit2 size={14} />
                </button>
                <form action={handleDelete}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmDeleteButton
                    label=""
                    pendingLabel=""
                    className="rounded-lg p-2 text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600"
                  />
                </form>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-[var(--color-text-muted)]">
              Немає FAQ записів
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
