"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Search,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { createDealWithContactAction } from "@/actions/admin/deals";
import {
  DEAL_STAGE_COLORS,
  PIPELINE_STAGES,
  type Contact,
  type DealStage,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { contacts: Contact[] };

const ALL_STAGES: DealStage[] = [
  ...PIPELINE_STAGES, "completed", "lost", "archived",
];

const SERVICE_TYPES = ["Двері", "Меблі", "Вікна", "Реставрація"] as const;

const SOURCE_KEYS = ["web_form", "phone", "direct", "referral", "manual"] as const;

// ─── Contact Combobox ─────────────────────────────────────
function ContactCombobox({
  contacts,
  selected,
  onSelect,
  placeholder,
  noResultsLabel,
}: {
  contacts: Contact[];
  selected: Contact | null;
  onSelect: (c: Contact | null) => void;
  placeholder: string;
  noResultsLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return contacts.slice(0, 8);
    return contacts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.email?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [contacts, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-100)] text-sm font-bold text-[var(--color-primary)]">
          {selected.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--color-text-primary)]">{selected.name}</p>
          {(selected.phone || selected.email) && (
            <p className="text-xs text-[var(--color-text-muted)] truncate">
              {selected.phone || selected.email}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="shrink-0 rounded-lg p-1 text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-section)] hover:text-[var(--color-text-secondary)]"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[var(--color-border)] bg-white py-3 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-xl"
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                {noResultsLabel}
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onSelect(c); setOpen(false); setQuery(""); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[var(--color-bg-section)]"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-100)] text-xs font-bold text-[var(--color-primary)]">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{c.name}</p>
                    {(c.phone || c.email) && (
                      <p className="truncate text-[11px] text-[var(--color-text-muted)]">
                        {c.phone || c.email}
                      </p>
                    )}
                  </div>
                  {(c.open_deals_count ?? 0) > 0 && (
                    <span className="shrink-0 rounded-full bg-[var(--color-primary-100)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                      {c.open_deals_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stage Select ─────────────────────────────────────────
function StageSelect({
  value,
  onChange,
  t,
}: {
  value: DealStage;
  onChange: (s: DealStage) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const colors = DEAL_STAGE_COLORS[value];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DealStage)}
        className={cn(
          "w-full appearance-none rounded-xl border border-[var(--color-border)] py-2.5 pl-8 pr-4 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20 cursor-pointer",
          colors.bg, colors.text,
        )}
      >
        {ALL_STAGES.map((s) => {
          const c = DEAL_STAGE_COLORS[s];
          return (
            <option key={s} value={s}>
              {t(`stages.${s}` as Parameters<typeof t>[0])}
            </option>
          );
        })}
      </select>
      <span className={cn("pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full", colors.dot)} />
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-shadow";

// ─── Main Form ────────────────────────────────────────────
export function NewDealForm({ contacts }: Props) {
  const router = useRouter();
  const t = useTranslations("admin.crm");
  const [isPending, startTransition] = useTransition();

  // Contact state
  const [contactMode, setContactMode] = useState<"existing" | "new">("existing");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Deal state
  const [stage, setStage] = useState<DealStage>("lead");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (contactMode === "existing") {
      if (!selectedContact) {
        toast.error("Оберіть контакт або перейдіть до створення нового");
        return;
      }
      fd.set("contact_id", selectedContact.id);
    }

    fd.set("stage", stage);
    fd.set("priority", priority);

    startTransition(async () => {
      const result = await createDealWithContactAction(fd);
      if (result.ok && result.dealId) {
        toast.success(result.message);
        router.push(`/admin/pipeline/${result.dealId}`);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg-section)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-white px-5 py-3.5 shadow-sm">
        <button
          type="button"
          onClick={() => router.push("/admin/pipeline")}
          className="flex items-center gap-1.5 rounded-xl p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-section)] hover:text-[var(--color-text-secondary)]"
        >
          <ArrowLeft size={17} />
        </button>
        <h1 className="font-display text-base font-semibold text-[var(--color-text-primary)]">
          {t("deal.new.title")}
        </h1>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* ── Contact section ──────────────────────────── */}
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                {t("deal.new.contactSection")}
              </p>
            </div>
            <div className="p-5 space-y-4">
              {/* Mode toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setContactMode("existing")}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                    contactMode === "existing"
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-section)]",
                  )}
                >
                  <Users size={14} />
                  {t("deal.new.existing")}
                </button>
                <button
                  type="button"
                  onClick={() => setContactMode("new")}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                    contactMode === "new"
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-section)]",
                  )}
                >
                  <UserPlus size={14} />
                  {t("deal.new.newContact")}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {contactMode === "existing" ? (
                  <motion.div
                    key="existing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <ContactCombobox
                      contacts={contacts}
                      selected={selectedContact}
                      onSelect={setSelectedContact}
                      placeholder={t("deal.new.searchContact")}
                      noResultsLabel={t("deal.new.noResults")}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="new"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                  >
                    <Field label={t("deal.new.contactName")}>
                      <input
                        name="contact_name"
                        required={contactMode === "new"}
                        placeholder="Іван Петренко"
                        className={inputCls}
                      />
                    </Field>
                    <Field label={t("deal.new.contactPhone")}>
                      <input
                        name="contact_phone"
                        type="tel"
                        placeholder="+380 99 000 0000"
                        className={inputCls}
                      />
                    </Field>
                    <Field label={t("deal.new.contactEmail")}>
                      <input
                        name="contact_email"
                        type="email"
                        placeholder="example@email.com"
                        className={inputCls}
                      />
                    </Field>
                    <Field label={t("deal.new.contactSource")}>
                      <select name="contact_source" defaultValue="manual" className={inputCls}>
                        {SOURCE_KEYS.map((v) => (
                          <option key={v} value={v}>
                            {t(`contacts.source.${v}` as Parameters<typeof t>[0])}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Deal details ──────────────────────────────── */}
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                {t("deal.new.dealSection")}
              </p>
            </div>
            <div className="p-5 space-y-4">
              {/* Title */}
              <Field label={t("deal.new.titleLabel")}>
                <input
                  name="title"
                  required
                  placeholder={t("deal.new.titlePlaceholder")}
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Service type */}
                <Field label={t("deal.new.serviceType")}>
                  <select name="service_type" defaultValue="" className={inputCls}>
                    <option value="">{t("deal.new.serviceNone")}</option>
                    {SERVICE_TYPES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>

                {/* Stage */}
                <Field label={t("deal.new.stage")}>
                  <StageSelect value={stage} onChange={setStage} t={t} />
                </Field>

                {/* Value */}
                <Field label={t("deal.new.value")}>
                  <input
                    name="value"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    className={inputCls}
                  />
                </Field>

                {/* Expected date */}
                <Field label={t("deal.new.expectedDate")}>
                  <input
                    name="expected_date"
                    type="date"
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Priority */}
              <Field label={t("deal.new.priority")}>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority("normal")}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                      priority === "normal"
                        ? "bg-[var(--color-primary)] text-white shadow-sm"
                        : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-section)]",
                    )}
                  >
                    <Check size={13} />
                    {t("deal.new.priorityNormal")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("urgent")}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                      priority === "urgent"
                        ? "bg-red-500 text-white shadow-sm"
                        : "border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-section)]",
                    )}
                  >
                    <Zap size={13} />
                    {t("deal.new.priorityUrgent")}
                  </button>
                </div>
              </Field>

              {/* Notes */}
              <Field label={t("deal.new.notes")}>
                <textarea
                  name="internal_notes"
                  rows={3}
                  placeholder="…"
                  className={cn(inputCls, "resize-none")}
                />
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-700)] disabled:opacity-50"
            >
              {isPending ? t("deal.new.submitting") : t("deal.new.submit")}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/pipeline")}
              className="rounded-xl border border-[var(--color-border)] px-5 py-2.5 text-sm transition hover:bg-[var(--color-bg-section)]"
            >
              {t("deal.new.back")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
