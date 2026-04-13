"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { Award, Edit2, Plus } from "lucide-react";
import { toast } from "sonner";
import { deleteCertificateAction } from "@/actions/admin/certificates";
import { ConfirmDeleteButton } from "@/components/admin/shared/confirm-delete-button";
import { cn } from "@/lib/utils";
import type { Certificate } from "@/lib/types";

export function CertificatesAdminClient({ certificates }: { certificates: Certificate[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      const result = await deleteCertificateAction(fd);
      if (result.ok) {
        toast.success(result.message);
        // Trigger revalidation via router refresh
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">
          {certificates.length > 0
            ? `${certificates.length} сертифікат${certificates.length === 1 ? "" : certificates.length < 5 ? "и" : "ів"}`
            : "Немає сертифікатів"}
        </p>
        <Link
          href="/admin/certificates/new"
          className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-700)]"
        >
          <Plus size={14} />
          Додати сертифікат
        </Link>
      </div>

      {/* Grid */}
      {certificates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white py-16 text-center">
          <Award size={32} className="mx-auto mb-3 text-[var(--color-text-muted)] opacity-40" />
          <p className="text-sm text-[var(--color-text-muted)]">Сертифікатів ще немає</p>
          <Link
            href="/admin/certificates/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]"
          >
            <Plus size={14} />
            Додати перший
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="group relative flex flex-col rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Image area */}
              <div className="flex h-36 items-center justify-center rounded-t-2xl bg-[var(--color-bg-section)] border-b border-[var(--color-border)]">
                {cert.image_url ? (
                  <Image
                    src={cert.image_url}
                    alt={cert.title}
                    width={120}
                    height={100}
                    className="h-24 w-auto object-contain"
                  />
                ) : (
                  <Award size={40} className="text-[var(--color-text-muted)] opacity-30" />
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold leading-snug text-[var(--color-text-primary)] line-clamp-2">
                    {cert.title}
                  </h4>
                  {!cert.is_published && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      Чернетка
                    </span>
                  )}
                </div>

                <p className="text-xs text-[var(--color-text-muted)]">
                  {cert.issuer}
                  {cert.issued_year ? ` · ${cert.issued_year}` : ""}
                </p>

                {cert.description && (
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-text-muted)] line-clamp-2">
                    {cert.description}
                  </p>
                )}

                {/* EN badge */}
                {cert.title_en && (
                  <span className="mt-auto pt-2 inline-flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                    🇬🇧 {cert.title_en}
                  </span>
                )}
              </div>

              {/* Actions — appear on hover */}
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Link
                  href={`/admin/certificates/${cert.id}/edit`}
                  className="flex items-center gap-1 rounded-lg bg-white px-2 py-1.5 text-xs font-medium shadow-sm transition hover:bg-[var(--color-bg-section)]"
                >
                  <Edit2 size={11} />
                  Редагувати
                </Link>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleDelete(cert.id);
                  }}
                >
                  <ConfirmDeleteButton
                    label=""
                    pendingLabel=""
                    className="rounded-lg bg-white px-2 py-1.5 shadow-sm hover:bg-red-50 hover:text-red-600"
                  />
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
