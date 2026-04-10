"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  MessageSquare,
  Phone,
  Search,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { addDealMessageAction } from "@/actions/admin/deals";
import { getDealMessagesForAdmin } from "@/lib/data/queries";
import {
  DEAL_STAGE_COLORS,
  DEAL_STAGE_LABELS,
  type Deal,
  type DealMessage,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  deals: Deal[];
};

export function MessagesInbox({ deals: initialDeals }: Props) {
  const [deals] = useState(initialDeals);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(
    initialDeals[0]?.id ?? null,
  );
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedDeal = deals.find((d) => d.id === selectedDealId);

  useEffect(() => {
    if (!selectedDealId) return;
    setLoadingMessages(true);
    // Fetch messages client-side when deal changes
    fetch(`/api/admin/deal-messages/${selectedDealId}`)
      .then((r) => r.json())
      .then((data: DealMessage[]) => setMessages(data))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [selectedDealId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filtered = deals.filter((d) => {
    const q = search.toLowerCase();
    return (
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.contact?.name.toLowerCase().includes(q) ||
      d.contact?.phone?.includes(q)
    );
  });

  const handleSend = () => {
    const content = msgContent.trim();
    if (!content || !selectedDealId) return;
    setMsgContent("");

    const optimistic: DealMessage = {
      id: crypto.randomUUID(),
      deal_id: selectedDealId,
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
      fd.set("deal_id", selectedDealId);
      fd.set("content", content);
      const result = await addDealMessageAction(fd);
      if (!result.ok) {
        toast.error(result.message);
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    });
  };

  const totalUnread = deals.reduce((s, d) => s + (d.unread_count ?? 0), 0);

  return (
    <div className="flex h-[calc(100vh-140px)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      {/* Left panel: deal list */}
      <div className="flex w-80 shrink-0 flex-col border-r border-[var(--color-border)]">
        <div className="border-b border-[var(--color-border)] p-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук…"
              className="w-full rounded-lg border border-[var(--color-border)] py-1.5 pl-8 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          {totalUnread > 0 && (
            <p className="mt-2 text-center text-xs text-red-500">{totalUnread} непрочитаних</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-[var(--color-text-muted)]">
              Немає переписок
            </div>
          )}
          {filtered.map((deal) => {
            const colors = DEAL_STAGE_COLORS[deal.stage];
            const isSelected = deal.id === selectedDealId;
            return (
              <button
                key={deal.id}
                type="button"
                onClick={() => setSelectedDealId(deal.id)}
                className={cn(
                  "w-full border-b border-[var(--color-border)] px-4 py-3 text-left transition",
                  isSelected
                    ? "bg-[var(--color-primary-100)]"
                    : "hover:bg-[var(--color-bg-section)]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-section)] text-xs font-bold text-[var(--color-text-secondary)]">
                      {deal.contact?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
                        {deal.contact?.name ?? "Невідомий"}
                      </p>
                      <p className="truncate text-[10px] text-[var(--color-text-muted)]">{deal.title}</p>
                    </div>
                  </div>
                  {(deal.unread_count ?? 0) > 0 && (
                    <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {deal.unread_count}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
                  <span className={cn("text-[10px]", colors.text)}>{DEAL_STAGE_LABELS[deal.stage]}</span>
                  {deal.contact?.phone && (
                    <span className="ml-auto flex items-center gap-0.5 text-[10px] text-[var(--color-text-muted)]">
                      <Phone size={8} /> {deal.contact.phone}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel: conversation */}
      {!selectedDeal ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-[var(--color-text-muted)]">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Оберіть переписку</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary-100)] text-sm font-bold text-[var(--color-primary)]">
              {selectedDeal.contact?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[var(--color-text-primary)]">{selectedDeal.contact?.name ?? "Невідомий"}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{selectedDeal.title}</p>
            </div>
            <a
              href={`/admin/pipeline/${selectedDeal.id}`}
              className="text-xs text-[var(--color-primary)] hover:underline"
            >
              Відкрити угоду →
            </a>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMessages && (
              <div className="text-center text-sm text-[var(--color-text-muted)]">Завантаження…</div>
            )}
            {!loadingMessages && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-[var(--color-text-muted)]">
                <MessageSquare size={32} className="opacity-20" />
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
                    "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                    msg.sender_type === "admin"
                      ? "rounded-tr-sm bg-[var(--color-primary)] text-white"
                      : "rounded-tl-sm bg-[var(--color-bg-section)] text-[var(--color-text-primary)]",
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="mt-1 text-[10px] opacity-60">
                    {new Date(msg.created_at).toLocaleString("uk-UA", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[var(--color-border)] p-3">
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
                placeholder="Написати повідомлення… (Enter — надіслати)"
                rows={2}
                className="flex-1 resize-none rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
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
      )}
    </div>
  );
}
