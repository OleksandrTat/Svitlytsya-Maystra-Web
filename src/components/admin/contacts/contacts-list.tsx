"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  Plus,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { upsertContactAction } from "@/actions/admin/contacts";
import type { Contact } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { contacts: Contact[] };

const AVATAR_GRADIENTS = [
  "from-sky-400 to-blue-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-rose-400 to-pink-500",
  "from-indigo-400 to-violet-500",
];

function activityInfo(lastActivity: string) {
  const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000);
  if (days <= 7)  return { label: "active",   className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
  if (days <= 30) return { label: "warm",     className: "bg-amber-50 text-amber-700 border-amber-100" };
  if (days <= 90) return { label: "cold",     className: "bg-sky-50 text-sky-700 border-sky-100" };
  return           { label: "inactive", className: "bg-zinc-50 text-zinc-500 border-zinc-100" };
}

export function ContactsList({ contacts: initial }: Props) {
  const router = useRouter();
  const t = useTranslations("admin.crm");
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

  const sourceKeys = ["web_form", "phone", "direct", "referral", "manual"] as const;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("contacts.searchPlaceholder")}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
              <X size={13} />
            </button>
          )}
        </div>
        <span className="text-sm text-[var(--color-text-muted)]">
          {t("contacts.count", { count: filtered.length })}
        </span>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-primary-700)] transition-colors"
        >
          <Plus size={14} />
          {t("contacts.newContact")}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {t("contacts.newContact")}
                </h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]">
                  <X size={15} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[var(--color-text-muted)]">{t("contacts.form.name")}</label>
                  <input
                    name="name"
                    required
                    placeholder="Іван Петренко"
                    className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[var(--color-text-muted)]">{t("contacts.form.phone")}</label>
                  <input
                    name="phone"
                    placeholder="+380 99 000 0000"
                    className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[var(--color-text-muted)]">{t("contacts.form.email")}</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[var(--color-text-muted)]">{t("contacts.form.source")}</label>
                  <select
                    name="source"
                    defaultValue="manual"
                    className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                  >
                    {sourceKeys.map((v) => (
                      <option key={v} value={v}>{t(`contacts.source.${v}` as Parameters<typeof t>[0])}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--color-primary-700)] transition-colors"
                  >
                    {isPending ? t("contacts.form.saving") : t("contacts.form.create")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-[var(--color-border)] px-5 py-2 text-sm transition hover:bg-[var(--color-bg-section)]"
                  >
                    {t("contacts.form.cancel")}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-section)]">
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {t("contacts.table.contact")}
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {t("contacts.table.links")}
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {t("contacts.table.deals")}
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {t("contacts.table.source")}
                </th>
                <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {t("contacts.table.activity")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map((contact, i) => {
                const activity = activityInfo(contact.last_activity_at);
                const gradient = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
                return (
                  <motion.tr
                    key={contact.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => router.push(`/admin/contacts/${contact.id}`)}
                    className="group cursor-pointer transition-colors hover:bg-[var(--color-bg-section)]"
                  >
                    {/* Name + avatar */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm",
                          gradient,
                        )}>
                          {contact.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                          {contact.name}
                        </span>
                      </div>
                    </td>

                    {/* Contact info */}
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        {contact.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                            <Phone size={11} className="shrink-0" />
                            {contact.phone}
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                            <Mail size={11} className="shrink-0" />
                            <span className="truncate max-w-[160px]">{contact.email}</span>
                          </div>
                        )}
                        {!contact.phone && !contact.email && (
                          <span className="text-xs text-[var(--color-text-muted)] opacity-40">—</span>
                        )}
                      </div>
                    </td>

                    {/* Deals */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {(contact.open_deals_count ?? 0) > 0 && (
                          <span className="flex items-center gap-1 rounded-full bg-[var(--color-primary-100)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-primary)]">
                            <TrendingUp size={9} />
                            {t("contacts.deals.active", { count: contact.open_deals_count ?? 0 })}
                          </span>
                        )}
                        {(contact.deals_count ?? 0) > 0 ? (
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {t("contacts.deals.total", { count: contact.deals_count ?? 0 })}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)] opacity-40">
                            {t("contacts.deals.none")}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="px-5 py-3.5">
                      <span className="rounded-full border bg-white px-2.5 py-1 text-[10px] font-medium text-[var(--color-text-muted)]">
                        {t(`contacts.source.${contact.source}` as Parameters<typeof t>[0])}
                      </span>
                    </td>

                    {/* Activity */}
                    <td className="px-5 py-3.5">
                      <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold", activity.className)}>
                        {t(`contacts.activity.${activity.label}` as Parameters<typeof t>[0])}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-[var(--color-text-muted)]">
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
