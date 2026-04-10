"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  Send,
  Zap,
  ChevronDown,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { updateDealStageAction, addDealMessageAction, deleteDealAction } from "@/actions/admin/deals";
import {
  DEAL_STAGE_COLORS,
  DEAL_STAGE_LABELS,
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

type Props = {
  deal: Deal;
  messages: DealMessage[];
  history: DealStageHistory[];
};

export function DealDetailClient({ deal: initialDeal, messages: initialMessages, history }: Props) {
  const router = useRouter();
  const [deal, setDeal] = useState(initialDeal);
  const [messages, setMessages] = useState(initialMessages);
  const [stageOpen, setStageOpen] = useState(false);
  const [msgContent, setMsgContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const colors = DEAL_STAGE_COLORS[deal.stage];

  const handleStageChange = (stage: DealStage) => {
    if (stage === deal.stage) { setStageOpen(false); return; }
    setStageOpen(false);
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
        toast.success("Статус оновлено");
      }
    });
  };

  const handleSendMessage = () => {
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
    setMessages((prev) => [...prev, optimistic]);

    startTransition(async () => {
      const fd = new FormData();
      fd.set("deal_id", deal.id);
      fd.set("content", content);
      const result = await addDealMessageAction(fd);
      if (!result.ok) {
        toast.error(result.message);
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", deal.id);
      const result = await deleteDealAction(fd);
      if (result.ok) {
        toast.success(result.message);
        router.push("/admin/pipeline");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="flex h-full min-h-screen flex-col bg-[var(--color-bg-section)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-white px-6 py-3">
        <button
          type="button"
          onClick={() => router.push("/admin/pipeline")}
          className="flex items-center gap-1.5 rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-section)]"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate font-display text-lg text-[var(--color-text-primary)]">{deal.title}</h1>
          {deal.contact && (
            <p className="text-xs text-[var(--color-text-muted)]">{deal.contact.name}</p>
          )}
        </div>
        {/* Stage selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStageOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              colors.bg, colors.text,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
            {DEAL_STAGE_LABELS[deal.stage]}
            <ChevronDown size={12} />
          </button>
          {stageOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-[var(--color-border)] bg-white py-1 shadow-lg">
              {ALL_STAGES.map((s) => {
                const c = DEAL_STAGE_COLORS[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStageChange(s)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition hover:bg-[var(--color-bg-section)]",
                      s === deal.stage ? "font-semibold" : "",
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full", c.dot)} />
                    {DEAL_STAGE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {deal.priority === "urgent" && (
          <span className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
            <Zap size={11} /> Терміново
          </span>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm("Видалити угоду? Цю дію не можна скасувати.")) return;
            handleDelete();
          }}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 disabled:opacity-40"
        >
          Видалити
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chat */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-[var(--color-text-muted)]">
                <MessageSquare size={32} className="opacity-30" />
                <p className="text-sm">Повідомлень ще немає</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex", msg.sender_type === "admin" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                    msg.sender_type === "admin"
                      ? "rounded-tr-sm bg-[var(--color-primary)] text-white"
                      : "rounded-tl-sm bg-white text-[var(--color-text-primary)] shadow-sm",
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={cn("mt-1 text-[10px] opacity-60")}>
                    {new Date(msg.created_at).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {msg.channel !== "internal" ? msg.channel : ""}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="border-t border-[var(--color-border)] bg-white p-3">
            <div className="flex gap-2">
              <textarea
                value={msgContent}
                onChange={(e) => setMsgContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Написати нотатку або повідомлення… (Enter — надіслати)"
                rows={2}
                className="flex-1 resize-none rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!msgContent.trim() || isPending}
                className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Info sidebar */}
        <div className="hidden w-72 shrink-0 overflow-y-auto border-l border-[var(--color-border)] bg-white p-4 lg:block">
          {/* Contact info */}
          {deal.contact && (
            <section className="mb-5">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Контакт</h3>
              <div className="rounded-xl border border-[var(--color-border)] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-100)] text-sm font-bold text-[var(--color-primary)]">
                    {deal.contact.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{deal.contact.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{deal.service_type ?? "Загальне"}</p>
                  </div>
                </div>
                {deal.contact.phone && (
                  <a href={`tel:${deal.contact.phone}`} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
                    <Phone size={12} /> {deal.contact.phone}
                  </a>
                )}
                {deal.contact.email && (
                  <a href={`mailto:${deal.contact.email}`} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
                    <Mail size={12} /> {deal.contact.email}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => router.push(`/admin/contacts/${deal.contact_id}`)}
                  className="mt-1 w-full rounded-lg border border-[var(--color-border)] py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)]"
                >
                  Картка контакту →
                </button>
              </div>
            </section>
          )}

          {/* Deal details */}
          <section className="mb-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Деталі</h3>
            <div className="space-y-2 text-sm">
              {deal.value && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Сума</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{deal.value.toLocaleString("uk-UA")} грн</span>
                </div>
              )}
              {deal.expected_date && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Дедлайн</span>
                  <span className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                    <Calendar size={11} />
                    {new Date(deal.expected_date).toLocaleDateString("uk-UA")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-muted)]">Створено</span>
                <span className="text-[var(--color-text-muted)]">{new Date(deal.created_at).toLocaleDateString("uk-UA")}</span>
              </div>
            </div>
          </section>

          {/* Notes */}
          {deal.internal_notes && (
            <section className="mb-5">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Нотатки</h3>
              <p className="rounded-xl bg-[var(--color-bg-section)] p-3 text-xs text-[var(--color-text-secondary)]">
                {deal.internal_notes}
              </p>
            </section>
          )}

          {/* Stage history */}
          {history.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Історія</h3>
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="flex items-start gap-2 text-xs">
                    <Clock size={10} className="mt-0.5 shrink-0 text-[var(--color-text-muted)]" />
                    <div>
                      <span className="text-[var(--color-text-muted)]">
                        {h.from_stage ? `${DEAL_STAGE_LABELS[h.from_stage]} → ` : ""}
                        <span className="font-medium text-[var(--color-text-secondary)]">{DEAL_STAGE_LABELS[h.to_stage]}</span>
                      </span>
                      {h.comment && <p className="mt-0.5 text-[var(--color-text-muted)]">{h.comment}</p>}
                      <p className="text-[var(--color-text-muted)] opacity-60">
                        {new Date(h.created_at).toLocaleDateString("uk-UA")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
