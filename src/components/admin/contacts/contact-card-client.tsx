"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Plus,
  TrendingUp,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { upsertContactAction } from "@/actions/admin/contacts";
import { ConfirmDeleteButton } from "@/components/admin/shared/confirm-delete-button";
import {
  DEAL_STAGE_COLORS,
  DEAL_STAGE_LABELS,
  type Contact,
  type Deal,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const SOURCE_LABELS: Record<string, string> = {
  web_form: "Сайт",
  phone: "Телефон",
  direct: "Прямий",
  referral: "Реферал",
  manual: "Вручну",
};

type Props = {
  contact: Contact;
  deals: Deal[];
};

export function ContactCardClient({ contact: initial, deals }: Props) {
  const router = useRouter();
  const [contact, setContact] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("id", contact.id);
    startTransition(async () => {
      const result = await upsertContactAction(fd);
      if (result.ok) {
        toast.success(result.message);
        setEditing(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const openDeals = deals.filter((d) => !["completed", "lost", "archived"].includes(d.stage));
  const closedDeals = deals.filter((d) => ["completed", "lost", "archived"].includes(d.stage));

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push("/admin/contacts")}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
      >
        <ArrowLeft size={14} /> Всі контакти
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-100)] text-xl font-bold text-[var(--color-primary)]">
            {contact.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {!editing ? (
              <>
                <h1 className="font-display text-2xl text-[var(--color-text-primary)]">{contact.name}</h1>
                <div className="mt-1 flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-[var(--color-primary)]">
                      <Phone size={13} /> {contact.phone}
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-[var(--color-primary)]">
                      <Mail size={13} /> {contact.email}
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <User size={13} /> {SOURCE_LABELS[contact.source] ?? contact.source}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {new Date(contact.created_at).toLocaleDateString("uk-UA")}
                  </span>
                </div>
                {contact.notes && (
                  <p className="mt-2 rounded-lg bg-[var(--color-bg-section)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
                    {contact.notes}
                  </p>
                )}
              </>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input name="name" defaultValue={contact.name} required placeholder="Ім'я"
                    className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                  <input name="phone" defaultValue={contact.phone ?? ""} placeholder="Телефон"
                    className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                  <input name="email" defaultValue={contact.email ?? ""} placeholder="Email" type="email"
                    className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                  <select name="source" defaultValue={contact.source}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none">
                    {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <textarea name="notes" defaultValue={contact.notes ?? ""} rows={2} placeholder="Нотатки"
                  className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none" />
                <div className="flex gap-2">
                  <button type="submit" disabled={isPending}
                    className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--color-primary-700)]">
                    {isPending ? "Збереження…" : "Зберегти"}
                  </button>
                  <button type="button" onClick={() => setEditing(false)}
                    className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-bg-section)]">
                    Скасувати
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing((v) => !v)}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-bg-section)]">
              Редагувати
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--color-text-primary)]">{deals.length}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Всього угод</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600">{openDeals.length}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Активних</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--color-text-secondary)]">{closedDeals.length}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Завершених</p>
          </div>
        </div>
      </div>

      {/* Active deals */}
      {openDeals.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Активні угоди</h2>
            <button
              type="button"
              onClick={() => router.push(`/admin/pipeline/new?contact_id=${contact.id}`)}
              className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
            >
              <Plus size={12} /> Нова угода
            </button>
          </div>
          <div className="space-y-2">
            {openDeals.map((deal) => {
              const c = DEAL_STAGE_COLORS[deal.stage];
              return (
                <div
                  key={deal.id}
                  onClick={() => router.push(`/admin/pipeline/${deal.id}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] p-3 transition hover:bg-[var(--color-bg-section)]"
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", c.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{deal.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{DEAL_STAGE_LABELS[deal.stage]}</p>
                  </div>
                  {deal.value && (
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      {deal.value.toLocaleString("uk-UA")} грн
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Closed deals */}
      {closedDeals.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Завершені угоди</h2>
          <div className="space-y-2">
            {closedDeals.map((deal) => {
              const c = DEAL_STAGE_COLORS[deal.stage];
              return (
                <div
                  key={deal.id}
                  onClick={() => router.push(`/admin/pipeline/${deal.id}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] p-3 opacity-70 transition hover:opacity-100 hover:bg-[var(--color-bg-section)]"
                >
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", c.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-[var(--color-text-secondary)]">{deal.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{DEAL_STAGE_LABELS[deal.stage]}</p>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {new Date(deal.updated_at).toLocaleDateString("uk-UA")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
