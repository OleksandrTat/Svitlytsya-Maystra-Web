"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { updateDealStageAction, addDealMessageAction, deleteDealAction } from "@/actions/admin/deals";
import {
  DEAL_STAGE_COLORS,
  PIPELINE_STAGES,
  type Deal,
  type DealMessage,
  type DealStage,
  type DealStageHistory,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL_STAGES: DealStage[] = [
  ...PIPELINE_STAGES, "completed", "lost", "archived",
];

type Tab = "chat" | "info" | "history";

type Props = {
  deal: Deal;
  messages: DealMessage[];
  history: DealStageHistory[];
};

// ─── Stage Stepper ────────────────────────────────────────
function StageStepper({
  current,
  onChange,
  t,
}: {
  current: DealStage;
  onChange: (s: DealStage) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(false);

  const currentColors = DEAL_STAGE_COLORS[current];
  const currentIndex = ALL_STAGES.indexOf(current);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
          currentColors.bg, currentColors.text,
          "hover:opacity-90",
        )}
      >
        <span className={cn("h-2 w-2 rounded-full", currentColors.dot)} />
        {t(`stages.${current}` as Parameters<typeof t>[0])}
        <ChevronRight size={12} className={cn("transition-transform", open && "rotate-90")} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-xl"
            >
              {ALL_STAGES.map((s, i) => {
                const c = DEAL_STAGE_COLORS[s];
                const isCurrent = s === current;
                const isPast = ALL_STAGES.indexOf(s) < currentIndex;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { onChange(s); setOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-xs transition hover:bg-[var(--color-bg-section)]",
                      isCurrent && "bg-[var(--color-bg-section)]",
                    )}
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", c.dot)} />
                    <span className={cn("flex-1 text-left", isCurrent ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]")}>
                      {t(`stages.${s}` as Parameters<typeof t>[0])}
                    </span>
                    {isCurrent && <Check size={12} className="text-[var(--color-primary)]" />}
                    {isPast && !isCurrent && <span className="text-[var(--color-text-muted)] opacity-50">✓</span>}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────
function ChatTab({
  deal,
  messages,
  t,
}: {
  deal: Deal;
  messages: DealMessage[];
  setMessages: React.Dispatch<React.SetStateAction<DealMessage[]>>;
  t: ReturnType<typeof useTranslations>;
}) {
  const [msgContent, setMsgContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [localMessages, setLocalMessages] = useState(messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const handleSend = () => {
    const content = msgContent.trim();
    if (!content) return;
    setMsgContent("");
    const optimistic: DealMessage = {
      id: crypto.randomUUID(),
      deal_id: deal.id,
      sender_type: "admin",
      sender_id: null,
      channel: "internal",
      content,
      is_read: true,
      created_at: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, optimistic]);

    startTransition(async () => {
      const fd = new FormData();
      fd.set("deal_id", deal.id);
      fd.set("content", content);
      const result = await addDealMessageAction(fd);
      if (!result.ok) {
        toast.error(result.message);
        setLocalMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {localMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-[var(--color-text-muted)]">
            <div className="rounded-2xl bg-[var(--color-bg-section)] p-5">
              <MessageSquare size={28} className="opacity-30" />
            </div>
            <p className="text-sm">{t("deal.noMessages")}</p>
          </div>
        )}
        {localMessages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={cn("flex", msg.sender_type === "admin" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-2.5",
                msg.sender_type === "admin"
                  ? "rounded-tr-sm bg-[var(--color-primary)] text-white"
                  : "rounded-tl-sm bg-white text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border)]",
              )}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              <p className={cn(
                "mt-1 text-[10px]",
                msg.sender_type === "admin" ? "text-white/60" : "text-[var(--color-text-muted)]",
              )}>
                {new Date(msg.created_at).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border)] bg-white p-3">
        <div className="flex gap-2">
          <textarea
            value={msgContent}
            onChange={(e) => setMsgContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t("deal.messagePlaceholder")}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-shadow"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!msgContent.trim() || isPending}
            className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Info Tab ─────────────────────────────────────────────
function InfoTab({ deal, t, router }: { deal: Deal; t: ReturnType<typeof useTranslations>; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Contact */}
      {deal.contact && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
            {t("deal.contact")}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-100)] text-sm font-bold text-[var(--color-primary)]">
              {deal.contact.name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">{deal.contact.name}</p>
              {deal.service_type && (
                <p className="text-xs text-[var(--color-text-muted)]">{deal.service_type}</p>
              )}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {deal.contact.phone && (
              <a
                href={`tel:${deal.contact.phone}`}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-bg-section)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
              >
                <Phone size={14} className="shrink-0 text-[var(--color-text-muted)]" />
                {deal.contact.phone}
              </a>
            )}
            {deal.contact.email && (
              <a
                href={`mailto:${deal.contact.email}`}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-bg-section)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
              >
                <Mail size={14} className="shrink-0 text-[var(--color-text-muted)]" />
                {deal.contact.email}
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => router.push(`/admin/contacts/${deal.contact_id}`)}
            className="mt-3 w-full rounded-xl border border-[var(--color-border)] py-2 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-section)]"
          >
            {t("deal.openContact")}
          </button>
        </div>
      )}

      {/* Deal details */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          {t("deal.details")}
        </p>
        <div className="space-y-3">
          {deal.value != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{t("deal.value")}</span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {deal.value.toLocaleString("uk-UA")} грн
              </span>
            </div>
          )}
          {deal.expected_date && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-muted)]">{t("deal.deadline")}</span>
              <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                <Calendar size={12} />
                {new Date(deal.expected_date).toLocaleDateString("uk-UA")}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">{t("deal.created")}</span>
            <span className="text-[var(--color-text-muted)]">
              {new Date(deal.created_at).toLocaleDateString("uk-UA")}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {deal.internal_notes && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
            {t("deal.notes")}
          </p>
          <p className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {deal.internal_notes}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────
function HistoryTab({ history, t }: { history: DealStageHistory[]; t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="flex-1 overflow-y-auto p-5">
      {history.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--color-text-muted)]">
          {t("deal.history")}
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-px bg-[var(--color-border)]" />
          <div className="space-y-4 pl-10">
            {history.map((h) => {
              const toColors = DEAL_STAGE_COLORS[h.to_stage];
              return (
                <div key={h.id} className="relative">
                  {/* Dot */}
                  <div className={cn(
                    "absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-white",
                    toColors.dot,
                  )} />
                  <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
                    <div className="flex items-center gap-2 text-xs">
                      {h.from_stage && (
                        <>
                          <span className={cn("rounded-full px-2 py-0.5 font-medium", DEAL_STAGE_COLORS[h.from_stage].bg, DEAL_STAGE_COLORS[h.from_stage].text)}>
                            {t(`stages.${h.from_stage}` as Parameters<typeof t>[0])}
                          </span>
                          <ChevronRight size={10} className="text-[var(--color-text-muted)]" />
                        </>
                      )}
                      <span className={cn("rounded-full px-2 py-0.5 font-semibold", toColors.bg, toColors.text)}>
                        {t(`stages.${h.to_stage}` as Parameters<typeof t>[0])}
                      </span>
                    </div>
                    {h.comment && (
                      <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">{h.comment}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                      <Clock size={9} />
                      {new Date(h.created_at).toLocaleString("uk-UA", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export function DealDetailClient({ deal: initialDeal, messages, history }: Props) {
  const router = useRouter();
  const t = useTranslations("admin.crm");
  const [deal, setDeal] = useState(initialDeal);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [, startTransition] = useTransition();
  const [messagesState, setMessagesState] = useState(messages);

  const colors = DEAL_STAGE_COLORS[deal.stage];

  const handleStageChange = (stage: DealStage) => {
    if (stage === deal.stage) return;
    const prev = deal.stage;
    setDeal((d) => ({ ...d, stage }));
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", deal.id);
      fd.set("stage", stage);
      const result = await updateDealStageAction(fd);
      if (!result.ok) {
        toast.error(result.message);
        setDeal((d) => ({ ...d, stage: prev }));
      } else {
        toast.success(t("deal.stageChanged"));
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(t("deal.confirmDelete"))) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", deal.id);
      const result = await deleteDealAction(fd);
      if (result.ok) {
        router.push("/admin/pipeline");
      } else {
        toast.error(result.message);
      }
    });
  };

  const unreadCount = messages.filter((m) => m.sender_type === "client" && !m.is_read).length;

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "chat", label: t("deal.tab.chat"), badge: unreadCount > 0 ? unreadCount : undefined },
    { id: "info", label: t("deal.tab.info") },
    { id: "history", label: t("deal.tab.history"), badge: history.length > 0 ? history.length : undefined },
  ];

  return (
    <div className="flex h-full min-h-screen flex-col bg-[var(--color-bg-section)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-white px-5 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => router.push("/admin/pipeline")}
          className="flex items-center gap-1.5 rounded-xl p-1.5 text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-section)] hover:text-[var(--color-text-secondary)]"
          title={t("deal.back")}
        >
          <ArrowLeft size={17} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="truncate font-display text-base font-semibold text-[var(--color-text-primary)]">
            {deal.title}
          </h1>
          {deal.contact && (
            <p className="text-xs text-[var(--color-text-muted)]">{deal.contact.name}</p>
          )}
        </div>

        <StageStepper current={deal.stage} onChange={handleStageChange} t={t} />

        {deal.priority === "urgent" && (
          <span className="hidden sm:flex items-center gap-1 rounded-xl bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600">
            <Zap size={11} />
            {t("deal.urgent")}
          </span>
        )}

        <button
          type="button"
          onClick={handleDelete}
          className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          {t("deal.delete")}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] bg-white px-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] -mb-px"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
            )}
          >
            {tab.label}
            {tab.badge != null && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            {activeTab === "chat" && (
              <ChatTab deal={deal} messages={messagesState} setMessages={setMessagesState} t={t} />
            )}
            {activeTab === "info" && (
              <InfoTab deal={deal} t={t} router={router} />
            )}
            {activeTab === "history" && (
              <HistoryTab history={history} t={t} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
