"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import {
  ArrowRightLeft,
  Bell,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Search,
  X,
  Zap,
  Archive,
  CheckCheck,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { InviteClientButton } from "@/components/admin/inquiries/invite-client-button";
import { updateInquiryStatusAction } from "@/actions/admin";
import type { Inquiry, InquiryStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type InquiriesBoardProps = {
  inquiries: Inquiry[];
};

const SERVICE_ICONS: Record<string, string> = {
  "Двері": "🚪",
  "Меблі": "🪑",
  "Вікна": "🪟",
  "Реставрація": "🛠️",
};

const STAGES: {
  status: InquiryStatus;
  label: string;
  icon: ReactNode;
  accent: string;
  soft: string;
  dot: string;
}[] = [
  {
    status: "new",
    label: "Нові",
    icon: <Bell size={13} />,
    accent: "text-sky-700",
    soft: "bg-sky-50 border-sky-200",
    dot: "bg-sky-400 animate-pulse",
  },
  {
    status: "contacted",
    label: "Зв'язались",
    icon: <Phone size={13} />,
    accent: "text-violet-700",
    soft: "bg-violet-50 border-violet-200",
    dot: "bg-violet-400",
  },
  {
    status: "quoted",
    label: "Розрахунок",
    icon: <MessageSquare size={13} />,
    accent: "text-amber-700",
    soft: "bg-amber-50 border-amber-200",
    dot: "bg-amber-400",
  },
  {
    status: "in_progress",
    label: "В роботі",
    icon: <Zap size={13} />,
    accent: "text-orange-700",
    soft: "bg-orange-50 border-orange-200",
    dot: "bg-orange-500",
  },
  {
    status: "won",
    label: "Виграно",
    icon: <CheckCircle2 size={13} />,
    accent: "text-emerald-700",
    soft: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  {
    status: "done",
    label: "Виконано",
    icon: <CheckCheck size={13} />,
    accent: "text-teal-700",
    soft: "bg-teal-50 border-teal-200",
    dot: "bg-teal-500",
  },
  {
    status: "lost",
    label: "Втрачено",
    icon: <X size={13} />,
    accent: "text-red-700",
    soft: "bg-red-50 border-red-200",
    dot: "bg-red-400",
  },
  {
    status: "archived",
    label: "Архів",
    icon: <Archive size={13} />,
    accent: "text-zinc-700",
    soft: "bg-zinc-50 border-zinc-200",
    dot: "bg-zinc-400",
  },
];

function relativeDate(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) {
    return "сьогодні";
  }
  if (days === 1) {
    return "вчора";
  }
  return `${days} дн тому`;
}

function InquiryCard({
  inquiry,
  onMove,
}: {
  inquiry: Inquiry;
  onMove: (id: string, status: InquiryStatus) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const stage = STAGES.find((item) => item.status === inquiry.status) ?? STAGES[0]!;

  return (
    <motion.article
      id={inquiry.id}
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group rounded-xl border border-[var(--color-border)] bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-[var(--color-text-secondary)]">
          {SERVICE_ICONS[inquiry.service_type] ?? "💬"} {inquiry.service_type}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
          <Clock size={9} />
          {relativeDate(inquiry.created_at)}
        </span>
      </div>

      <p className="mt-1.5 font-semibold leading-tight text-[var(--color-text-primary)]">
        {inquiry.name}
      </p>

      <div className="mt-1.5 space-y-0.5">
        {inquiry.phone ? (
          <a
            href={`tel:${inquiry.phone}`}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          >
            <Phone size={10} />
            {inquiry.phone}
          </a>
        ) : null}
        {inquiry.email ? (
          <a
            href={`mailto:${inquiry.email}`}
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          >
            <Mail size={10} />
            <span className="max-w-[160px] truncate">{inquiry.email}</span>
          </a>
        ) : null}
      </div>

      {inquiry.message ? (
        <p className="mt-2 line-clamp-3 border-l-2 border-[var(--color-border)] pl-2 text-xs italic text-[var(--color-text-secondary)]">
          {inquiry.message}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition hover:border-current/40",
              stage.accent,
              stage.soft,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", stage.dot)} />
            {stage.label}
            <ArrowRightLeft size={10} className="opacity-60" />
          </button>

          <AnimatePresence>
            {menuOpen ? (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-xl"
                >
                  {STAGES.map((item) => (
                    <button
                      key={item.status}
                      type="button"
                      onClick={() => {
                        onMove(inquiry.id, item.status);
                        setMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-[var(--color-surface)]",
                        inquiry.status === item.status ? "bg-[var(--color-surface)] font-semibold" : "",
                      )}
                    >
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", item.dot)} />
                      {item.label}
                      {inquiry.status === item.status ? (
                        <CheckCircle2 size={10} className="ml-auto text-[var(--color-primary)]" />
                      ) : null}
                    </button>
                  ))}
                </motion.div>
              </>
            ) : null}
          </AnimatePresence>
        </div>

        <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">
          {inquiry.id.slice(0, 8)}
        </span>
      </div>

      <div className="mt-3 border-t border-[var(--color-border)] pt-3">
        <InviteClientButton
          inquiryId={inquiry.id}
          inquiryName={inquiry.name}
          inquiryEmail={inquiry.email}
        />
      </div>
    </motion.article>
  );
}

function Column({
  cards,
  onMove,
  stage,
}: {
  cards: Inquiry[];
  onMove: (id: string, status: InquiryStatus) => void;
  stage: (typeof STAGES)[number];
}) {
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

      <div className="space-y-2.5" style={{ minHeight: 100 }}>
        <AnimatePresence mode="popLayout">
          {cards.map((inquiry) => (
            <InquiryCard key={inquiry.id} inquiry={inquiry} onMove={onMove} />
          ))}
        </AnimatePresence>

        {cards.length === 0 ? (
          <div className="flex h-14 items-center justify-center rounded-xl border border-dashed border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-secondary)]">Порожньо</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function InquiriesBoard({ inquiries: initialInquiries }: InquiriesBoardProps) {
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [, startTransition] = useTransition();

  const filteredInquiries = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return inquiries.filter((inquiry) => {
      if (!showArchived && inquiry.status === "archived") {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        inquiry.name.toLowerCase().includes(normalizedQuery) ||
        inquiry.service_type.toLowerCase().includes(normalizedQuery) ||
        (inquiry.phone ?? "").includes(normalizedQuery) ||
        (inquiry.email ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [inquiries, query, showArchived]);

  const stats = useMemo(() => {
    const total = inquiries.length;
    const won = inquiries.filter((inquiry) => inquiry.status === "won").length;
    return {
      total,
      new: inquiries.filter((inquiry) => inquiry.status === "new").length,
      won,
      conversion: total > 0 ? Math.round((won / total) * 100) : 0,
    };
  }, [inquiries]);

  const visibleStages = useMemo(
    () => (showArchived ? STAGES : STAGES.filter((stage) => stage.status !== "archived")),
    [showArchived],
  );

  const handleMove = (id: string, status: InquiryStatus) => {
    const previous = inquiries;
    setInquiries((current) => current.map((inquiry) => (inquiry.id === id ? { ...inquiry, status } : inquiry)));

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", id);
        formData.set("status", status);

        const result = await updateInquiryStatusAction(formData);
        if (!result.ok) {
          setInquiries(previous);
          toast.error(result.message);
          return;
        }

        toast.success("Статус заявки оновлено");
      } catch {
        setInquiries(previous);
        toast.error("Не вдалося оновити статус заявки");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Всього заявок",
            value: stats.total,
            className: "bg-white border-[var(--color-border)]",
            textClassName: "text-[var(--color-text-primary)]",
          },
          {
            label: "Нових",
            value: stats.new,
            className: "bg-sky-50 border-sky-200",
            textClassName: "text-sky-700",
          },
          {
            label: "Виграно",
            value: stats.won,
            className: "bg-emerald-50 border-emerald-200",
            textClassName: "text-emerald-700",
          },
          {
            label: "Конверсія",
            value: `${stats.conversion}%`,
            className: "bg-amber-50 border-amber-200",
            textClassName: "text-amber-700",
          },
        ].map((item) => (
          <div key={item.label} className={cn("rounded-2xl border p-4", item.className)}>
            <p className="text-xs text-[var(--color-text-secondary)]">{item.label}</p>
            <p className={cn("mt-1 text-2xl font-bold", item.textClassName)}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2">
          <Search size={14} className="shrink-0 text-[var(--color-text-secondary)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук за ім'ям, телефоном, email..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />
          <span className="text-[var(--color-text-secondary)]">Показати архів</span>
        </label>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {visibleStages.map((stage) => (
            <Column
              key={stage.status}
              stage={stage}
              cards={filteredInquiries.filter((inquiry) => inquiry.status === stage.status)}
              onMove={handleMove}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
