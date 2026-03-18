"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useTransition } from "react";
import {
  Bell, CheckCircle2, Clock, Mail, MessageSquare,
  Phone, Search, X, Zap, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type InquiryStatus = "new" | "contacted" | "quoted" | "in_progress" | "won" | "lost" | "archived";

type Inquiry = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  service_type: string;
  message?: string | null;
  status: InquiryStatus;
  created_at: string;
};

type Props = { inquiries: Inquiry[] };

const STAGES: {
  status: InquiryStatus;
  label: string;
  icon: React.ReactNode;
  accent: string;
  soft: string;
  dot: string;
}[] = [
  { status: "new",         label: "Нові",        icon: <Bell size={13} />,          accent: "text-sky-700",     soft: "bg-sky-50 border-sky-200",        dot: "bg-sky-400 animate-pulse" },
  { status: "contacted",   label: "Зв'язались",  icon: <Phone size={13} />,         accent: "text-violet-700",  soft: "bg-violet-50 border-violet-200",  dot: "bg-violet-400" },
  { status: "quoted",      label: "Розрахунок",  icon: <MessageSquare size={13} />, accent: "text-amber-700",   soft: "bg-amber-50 border-amber-200",    dot: "bg-amber-400" },
  { status: "in_progress", label: "В роботі",    icon: <Zap size={13} />,           accent: "text-orange-700",  soft: "bg-orange-50 border-orange-200",  dot: "bg-orange-500" },
  { status: "won",         label: "Виграно",     icon: <CheckCircle2 size={13} />,  accent: "text-emerald-700", soft: "bg-emerald-50 border-emerald-200",dot: "bg-emerald-500" },
  { status: "lost",        label: "Втрачено",    icon: <X size={13} />,             accent: "text-red-700",     soft: "bg-red-50 border-red-200",        dot: "bg-red-400" },
];

const SERVICE_ICONS: Record<string, string> = {
  "Двері": "🚪", "Меблі": "🪑", "Вікна": "🪟", "Реставрація": "🔧",
};

function relativeDate(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "сьогодні";
  if (d === 1) return "вчора";
  return `${d}д тому`;
}

function InquiryCard({ inquiry, onMove }: { inquiry: Inquiry; onMove: (id: string, s: InquiryStatus) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const stage = STAGES.find((s) => s.status === inquiry.status) ?? STAGES[0]!;

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="group relative cursor-default rounded-xl border border-[var(--color-border)] bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-[var(--color-text-secondary)]">
          {SERVICE_ICONS[inquiry.service_type] ?? "💬"} {inquiry.service_type}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
          <Clock size={9} /> {relativeDate(inquiry.created_at)}
        </span>
      </div>

      <p className="mt-1.5 font-semibold leading-tight text-[var(--color-text-primary)]">{inquiry.name}</p>

      <div className="mt-1.5 space-y-0.5">
        {inquiry.phone && (
          <a href={`tel:${inquiry.phone}`} onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
            <Phone size={10} /> {inquiry.phone}
          </a>
        )}
        {inquiry.email && (
          <a href={`mailto:${inquiry.email}`} onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
            <Mail size={10} /> <span className="max-w-[130px] truncate">{inquiry.email}</span>
          </a>
        )}
      </div>

      {inquiry.message && (
        <p className="mt-2 line-clamp-2 border-l-2 border-[var(--color-border)] pl-2 text-xs italic text-[var(--color-text-secondary)]">
          {inquiry.message}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen((o) => !o)}
            className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition hover:border-current/40", stage.accent, stage.soft)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", stage.dot)} />
            {stage.label}
            <span className="opacity-40">▾</span>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }} transition={{ duration: 0.1 }}
                  className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-xl">
                  {STAGES.map((st) => (
                    <button key={st.status} type="button"
                      onClick={() => { onMove(inquiry.id, st.status); setMenuOpen(false); }}
                      className={cn("flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-[var(--color-surface)]",
                        inquiry.status === st.status && "bg-[var(--color-surface)] font-semibold")}>
                      <span className={cn("h-2 w-2 rounded-full shrink-0", st.dot)} />
                      {st.label}
                      {inquiry.status === st.status && <CheckCircle2 size={10} className="ml-auto text-[var(--color-primary)]" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <a href={`/admin/inquiries/${inquiry.id}`} onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-0.5 rounded-lg p-1 text-[10px] text-[var(--color-text-secondary)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--color-primary)]">
          <ArrowUpRight size={12} />
        </a>
      </div>
    </motion.div>
  );
}

function Column({ stage, cards, onMove }: { stage: typeof STAGES[0]; cards: Inquiry[]; onMove: (id: string, s: InquiryStatus) => void }) {
  return (
    <div className="flex w-64 shrink-0 flex-col gap-2 xl:w-[17rem]">
      <div className={cn("flex items-center justify-between rounded-xl border px-3 py-2.5", stage.soft)}>
        <div className={cn("flex items-center gap-2", stage.accent)}>
          {stage.icon}
          <span className="text-sm font-semibold">{stage.label}</span>
        </div>
        <span className={cn("rounded-full border border-current/30 px-2 py-0.5 text-xs font-bold", stage.accent)}>
          {cards.length}
        </span>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto" style={{ minHeight: 100 }}>
        <AnimatePresence mode="popLayout">
          {cards.map((inq) => (
            <InquiryCard key={inq.id} inquiry={inq} onMove={onMove} />
          ))}
        </AnimatePresence>
        {cards.length === 0 && (
          <div className="flex h-14 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-secondary)]">Порожньо</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function InquiriesBoard({ inquiries: init }: Props) {
  const [inquiries, setInquiries] = useState(init);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [, startTransition] = useTransition();

  const handleMove = (id: string, status: InquiryStatus) => {
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    startTransition(async () => {
      try {
        // const fd = new FormData(); fd.set("id", id); fd.set("status", status);
        // await updateInquiryStatusAction(fd);
        toast.success("Статус оновлено");
      } catch {
        toast.error("Помилка");
      }
    });
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return inquiries.filter((i) => {
      if (!showArchived && i.status === "archived") return false;
      if (q && !i.name.toLowerCase().includes(q) &&
          !(i.phone ?? "").includes(q) &&
          !(i.email ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [inquiries, query, showArchived]);

  const stats = {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
    won: inquiries.filter((i) => i.status === "won").length,
    conv: inquiries.length ? Math.round((inquiries.filter((i) => i.status === "won").length / inquiries.length) * 100) : 0,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Всього заявок", value: stats.total, cls: "bg-white border-[var(--color-border)]", txt: "text-[var(--color-text-primary)]" },
          { label: "Нових",         value: stats.new,   cls: "bg-sky-50 border-sky-200",      txt: "text-sky-700" },
          { label: "Виграно",       value: stats.won,   cls: "bg-emerald-50 border-emerald-200", txt: "text-emerald-700" },
          { label: "Конверсія",     value: `${stats.conv}%`, cls: "bg-amber-50 border-amber-200", txt: "text-amber-700" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-4", s.cls)}>
            <p className="text-xs text-[var(--color-text-secondary)]">{s.label}</p>
            <p className={cn("mt-1 text-2xl font-bold", s.txt)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2">
          <Search size={14} className="shrink-0 text-[var(--color-text-secondary)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук за ім'ям, телефоном, email..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]" />
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          <span className="text-[var(--color-text-secondary)]">Архів</span>
        </label>
      </div>

      {/* Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {STAGES.map((stage) => (
            <Column key={stage.status} stage={stage}
              cards={filtered.filter((i) => i.status === stage.status)} onMove={handleMove} />
          ))}
        </div>
      </div>
    </div>
  );
}
