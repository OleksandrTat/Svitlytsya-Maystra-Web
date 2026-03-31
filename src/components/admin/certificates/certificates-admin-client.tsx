"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Edit2, Plus, Award } from "lucide-react";
import {
  upsertCertificateAction,
  deleteCertificateAction,
} from "@/actions/admin/certificates";
import { ConfirmDeleteButton } from "@/components/admin/shared/confirm-delete-button";
import type { Certificate } from "@/lib/types";

export function CertificatesAdminClient({
  certificates: initial,
}: {
  certificates: Certificate[];
}) {
  const [items, setItems] = useState(initial);
  const [editItem, setEditItem] = useState<Certificate | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await upsertCertificateAction(formData);
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
      const result = await deleteCertificateAction(formData);
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
    <div className="space-y-6">
      {/* Form */}
      <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
          {editItem ? "Редагувати сертифікат" : "Додати сертифікат"}
        </h3>
        <form action={handleSubmit} className="space-y-4">
          {editItem && <input type="hidden" name="id" value={editItem.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Назва *
              </label>
              <input
                type="text"
                name="title"
                required
                defaultValue={editItem?.title ?? ""}
                key={editItem?.id ?? "new-t"}
                className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Видавець *
              </label>
              <input
                type="text"
                name="issuer"
                required
                defaultValue={editItem?.issuer ?? ""}
                key={editItem?.id ?? "new-i"}
                className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                Рік видачі
              </label>
              <input
                type="number"
                name="issued_year"
                min={1990}
                max={2030}
                defaultValue={editItem?.issued_year ?? ""}
                key={editItem?.id ?? "new-y"}
                className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              />
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
            <div className="flex items-end">
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

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
              Опис
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={editItem?.description ?? ""}
              key={editItem?.id ?? "new-d"}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
              URL зображення
            </label>
            <input
              type="url"
              name="image_url"
              placeholder="https://..."
              defaultValue={editItem?.image_url ?? ""}
              key={editItem?.id ?? "new-img"}
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
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

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((cert) => (
          <div
            key={cert.id}
            className="group relative rounded-xl border border-[var(--color-border)] bg-white p-4"
          >
            <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-[var(--color-bg-section)]">
              {cert.image_url ? (
                <Image
                  src={cert.image_url}
                  alt={cert.title}
                  width={80}
                  height={80}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <Award
                  size={32}
                  className="text-[var(--color-text-muted)]"
                />
              )}
            </div>

            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {cert.title}
            </h4>
            <p className="text-xs text-[var(--color-text-muted)]">
              {cert.issuer}
              {cert.issued_year ? ` (${cert.issued_year})` : ""}
            </p>

            {!cert.is_published && (
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                Чернетка
              </span>
            )}

            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => setEditItem(cert)}
                className="rounded-lg bg-white p-1.5 shadow-sm hover:bg-[var(--color-bg-warm)]"
                title="Редагувати"
              >
                <Edit2 size={12} />
              </button>
              <form action={handleDelete}>
                <input type="hidden" name="id" value={cert.id} />
                <ConfirmDeleteButton
                  label=""
                  pendingLabel=""
                  className="rounded-lg bg-white p-1.5 shadow-sm hover:bg-red-50 hover:text-red-600"
                />
              </form>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full py-10 text-center text-sm text-[var(--color-text-muted)]">
            Немає сертифікатів
          </div>
        )}
      </div>
    </div>
  );
}
