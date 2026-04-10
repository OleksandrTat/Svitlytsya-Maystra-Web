"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  Plus,
  Search,
  TrendingUp,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { upsertContactAction } from "@/actions/admin/contacts";
import type { Contact } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  contacts: Contact[];
};

const SOURCE_LABELS: Record<string, string> = {
  web_form: "Сайт",
  phone: "Телефон",
  direct: "Прямий",
  referral: "Реферал",
  manual: "Вручну",
};

const AVATAR_COLORS = [
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

export function ContactsList({ contacts: initial }: Props) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initial);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setIsPending(true);
    const result = await upsertContactAction(fd);
    setIsPending(false);
    if (result.ok) {
      toast.success(result.message);
      setShowForm(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const daysSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / 86400000);
  };

  const activityBadge = (contact: Contact) => {
    const days = daysSince(contact.last_activity_at);
    if (days <= 7)  return { label: "Активний", className: "bg-emerald-50 text-emerald-700" };
    if (days <= 30) return { label: "Теплий",   className: "bg-amber-50 text-amber-700" };
    if (days <= 90) return { label: "Холодний",  className: "bg-sky-50 text-sky-700" };
    return { label: "Неактивний", className: "bg-zinc-100 text-zinc-500" };
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за ім'ям, телефоном, email…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-white py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <span className="text-sm text-[var(--color-text-muted)]">{filtered.length} контактів</span>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--color-primary-700)]"
        >
          <Plus size={13} /> Новий контакт
        </button>
      </div>

      {/* Quick create form */}
      {showForm && (
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Новий контакт</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              name="name"
              required
              placeholder="Ім'я *"
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
            <input
              name="phone"
              placeholder="Телефон"
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
            <select
              name="source"
              defaultValue="manual"
              className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            >
              {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--color-primary-700)]"
              >
                {isPending ? "Збереження…" : "Створити"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-bg-section)]"
              >
                Скасувати
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-section)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)]">Контакт</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)]">Зв'язок</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)]">Угоди</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)]">Джерело</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)]">Активність</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map((contact, i) => {
                const badge = activityBadge(contact);
                const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <tr
                    key={contact.id}
                    onClick={() => router.push(`/admin/contacts/${contact.id}`)}
                    className="cursor-pointer transition hover:bg-[var(--color-bg-section)]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", avatarColor)}>
                          {contact.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-[var(--color-text-primary)]">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {contact.phone && (
                          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                            <Phone size={10} /> {contact.phone}
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                            <Mail size={10} /> {contact.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(contact.open_deals_count ?? 0) > 0 && (
                          <span className="flex items-center gap-1 rounded-full bg-[var(--color-primary-100)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                            <TrendingUp size={9} /> {contact.open_deals_count} активних
                          </span>
                        )}
                        {(contact.deals_count ?? 0) > 0 && (
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {contact.deals_count} всього
                          </span>
                        )}
                        {!contact.deals_count && (
                          <span className="text-xs text-[var(--color-text-muted)]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[var(--color-bg-section)] px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                        {SOURCE_LABELS[contact.source] ?? contact.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", badge.className)}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-[var(--color-text-muted)]">
                    {search ? "Нічого не знайдено" : "Контактів ще немає"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
