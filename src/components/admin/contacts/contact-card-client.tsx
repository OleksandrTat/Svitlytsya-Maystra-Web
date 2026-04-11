"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Check,
  Mail,
  Pencil,
  Phone,
  Plus,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { upsertContactAction } from "@/actions/admin/contacts";
import {
  DEAL_STAGE_COLORS,
  type Contact,
  type Deal,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  contact: Contact;
  deals: Deal[];
};

const SOURCE_KEYS = ["web_form", "phone", "direct", "referral", "manual"] as const;

const STAT_COLORS = [
  { bg: "bg-[var(--color-primary-100)]", text: "text-[var(--color-primary)]" },
  { bg: "bg-emerald-50", text: "text-emerald-700" },
  { bg: "bg-zinc-50", text: "text-zinc-600" },
];

export function ContactCardClient({ contact: initial, deals }: Props) {
  const router = useRouter();
  const t = useTranslations("admin.crm");
  const [contact, setContact] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openDeals = deals.filter((d) => !["completed", "lost", "archived"].includes(d.stage));
  const closedDeals = deals.filter((d) => ["completed", "lost", "archived"].includes(d.stage));

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

  const stats = [
    { label: t("contact.stats.total"),  value: deals.length },
    { label: t("contact.stats.active"), value: openDeals.length },
    { label: t("contact.stats.closed"), value: closedDeals.length },
  ];

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push("/admin/contacts")}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition hover:text-[var(--color-text-secondary)]"
      >
        <ArrowLeft size={14} />
        {t("contact.back")}
      </button>

      {/* Profile card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
        {/* Gradient header bar */}
        <div className="h-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-700)]" />

        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-700)] text-2xl font-bold text-white shadow-sm">
              {contact.name[0]?.toUpperCase()}
            </div>

            {/* Info / Edit form */}
            <div className="flex-1 min-w-0">
              {!editing ? (
                <>
                  <h1 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
                    {contact.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1.5 rounded-xl bg-[var(--color-bg-section)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
                      >
                        <Phone size={13} className="text-[var(--color-text-muted)]" />
                        {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1.5 rounded-xl bg-[var(--color-bg-section)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
                      >
                        <Mail size={13} className="text-[var(--color-text-muted)]" />
                        {contact.email}
                      </a>
                    )}
                    <span className="flex items-center gap-1.5 rounded-xl bg-[var(--color-bg-section)] px-3 py-1.5 text-sm text-[var(--color-text-muted)]">
                      <Calendar size={13} />
                      {new Date(contact.created_at).toLocaleDateString("uk-UA")}
                    </span>
                  </div>
                  {contact.notes && (
                    <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 border border-amber-100">
                      {contact.notes}
                    </p>
                  )}
                </>
              ) : (
                <form onSubmit={handleUpdate} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-[var(--color-text-muted)]">{t("contacts.form.name")}</label>
                      <input
                        name="name"
                        defaultValue={contact.name}
                        required
                        className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-[var(--color-text-muted)]">{t("contacts.form.phone")}</label>
                      <input
                        name="phone"
                        defaultValue={contact.phone ?? ""}
                        className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-[var(--color-text-muted)]">{t("contacts.form.email")}</label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={contact.email ?? ""}
                        className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-[var(--color-text-muted)]">{t("contacts.form.source")}</label>
                      <select
                        name="source"
                        defaultValue={contact.source}
                        className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                      >
                        {SOURCE_KEYS.map((v) => (
                          <option key={v} value={v}>{t(`contacts.source.${v}` as Parameters<typeof t>[0])}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[11px] font-medium text-[var(--color-text-muted)]">{t("contacts.form.notes")}</label>
                      <textarea
                        name="notes"
                        defaultValue={contact.notes ?? ""}
                        rows={2}
                        className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--color-primary-700)] transition-colors"
                    >
                      <Check size={14} />
                      {isPending ? t("contacts.form.saving") : t("contacts.form.save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm transition hover:bg-[var(--color-bg-section)]"
                    >
                      <X size={14} />
                      {t("contacts.form.cancel")}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-section)] hover:text-[var(--color-text-secondary)]"
              >
                <Pencil size={12} />
                {t("contact.edit")}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-5">
            {stats.map((stat, i) => (
              <div key={stat.label} className={cn("rounded-2xl p-4 text-center", STAT_COLORS[i].bg)}>
                <p className={cn("text-2xl font-bold", STAT_COLORS[i].text)}>{stat.value}</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active deals */}
      {openDeals.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              <TrendingUp size={14} className="text-[var(--color-primary)]" />
              {t("contact.activeDeals")}
            </h2>
            <button
              type="button"
              onClick={() => router.push(`/admin/pipeline/new?contact_id=${contact.id}`)}
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              <Plus size={12} />
              {t("contact.newDeal")}
            </button>
          </div>
          <div className="space-y-2">
            {openDeals.map((deal, i) => {
              const c = DEAL_STAGE_COLORS[deal.stage];
              return (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => router.push(`/admin/pipeline/${deal.id}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] p-3.5 transition hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-bg-section)] hover:shadow-sm"
                >
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", c.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{deal.title}</p>
                    <p className={cn("text-xs font-medium", c.text)}>
                      {t(`stages.${deal.stage}` as Parameters<typeof t>[0])}
                    </p>
                  </div>
                  {deal.value && (
                    <span className={cn("shrink-0 rounded-xl px-2.5 py-1 text-xs font-semibold", c.bg, c.text)}>
                      {deal.value.toLocaleString("uk-UA")} грн
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Closed deals */}
      {closedDeals.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
            {t("contact.closedDeals")}
          </h2>
          <div className="space-y-2">
            {closedDeals.map((deal) => {
              const c = DEAL_STAGE_COLORS[deal.stage];
              return (
                <div
                  key={deal.id}
                  onClick={() => router.push(`/admin/pipeline/${deal.id}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] p-3.5 opacity-60 transition hover:opacity-100 hover:bg-[var(--color-bg-section)]"
                >
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", c.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-[var(--color-text-secondary)]">{deal.title}</p>
                    <p className={cn("text-xs", c.text)}>
                      {t(`stages.${deal.stage}` as Parameters<typeof t>[0])}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                    {new Date(deal.updated_at).toLocaleDateString("uk-UA")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {deals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-10 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">{t("contact.noDeals")}</p>
          <button
            type="button"
            onClick={() => router.push(`/admin/pipeline/new?contact_id=${contact.id}`)}
            className="mt-3 flex items-center gap-1.5 mx-auto rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-primary-700)] transition-colors"
          >
            <Plus size={13} />
            {t("contact.newDeal")}
          </button>
        </div>
      )}
    </div>
  );
}
