"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  MessageSquare,
  Phone,
  Search,
  Send,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { addDealMessageAction } from "@/actions/admin/deals";
import {
  DEAL_STAGE_COLORS,
  type Deal,
  type DealMessage,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { deals: Deal[] };

const AVATAR_GRADIENTS = [
  "from-sky-400 to-blue-500",
  "from-violet-400 to-purple-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-rose-400 to-pink-500",
  "from-indigo-400 to-violet-500",
];

export function MessagesInbox({ deals: initialDeals }: Props) {
  const t = useTranslations("admin.crm");
  const [deals] = useState(initialDeals);
  const [selectedId, setSelectedId] = useState<string | null>(initialDeals[0]?.id ?? null);
  const [messages, setMessages] = useState<DealMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [search, setSearch] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedDeal = deals.find((d) => d.id === selectedId);
  const totalUnread = deals.reduce((s, d) => s + (d.unread_count ?? 0), 0);

  // Load messages when selection changes
  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    setLoadingMsgs(true);
    fetch(`/api/admin/deal-messages/${selectedId}`)
      .then((r) => r.json())
      .then((data: DealMessage[]) => setMessages(data))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));
  }, [selectedId]);

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
    if (!content || !selectedId) return;
    setMsgContent("");

    const optimistic: DealMessage = {
      id: crypto.randomUUID(),
      deal_id: selectedId,
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
      fd.set("deal_id", selectedId);
      fd.set("content", content);
      const result = await addDealMessageAction(fd);
      if (!result.ok) {
        toast.error(result.message);
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    });
  };

  return (
    <div className="flex h-[calc(100vh-160px)] min-h-[500px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
      {/* ── Left panel: conversation list ───────────────────── */}
      <div className="flex w-72 shrink-0 flex-col border-r border-[var(--color-border)]">
        {/* Search */}
        <div className="p-3 border-b border-[var(--color-border)]">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("messages.searchPlaceholder")}
              className="w-full rounded-xl border border-[var(--color-border)] py-2 pl-8 pr-8 text-sm focus:border-[var(--color-primary)] focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <X size={12} />
              </button>
            )}
          </div>
          {totalUnread > 0 && (
            <p className="mt-2 text-center text-xs font-medium text-red-500">
              {t("messages.unread", { count: totalUnread })}
            </p>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              {t("messages.noConversations")}
            </div>
          )}
          {filtered.map((deal, i) => {
            const isSelected = deal.id === selectedId;
            const colors = DEAL_STAGE_COLORS[deal.stage];
            const gradient = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
            const unread = deal.unread_count ?? 0;

            return (
              <button
                key={deal.id}
                type="button"
                onClick={() => setSelectedId(deal.id)}
                className={cn(
                  "w-full border-b border-[var(--color-border)] px-3 py-3 text-left transition-colors",
                  isSelected
                    ? "bg-[var(--color-primary-100)]"
                    : "hover:bg-[var(--color-bg-section)]",
                )}
              >
                <div className="flex items-start gap-2.5">
                  {/* Avatar */}
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow-sm",
                    gradient,
                  )}>
                    {deal.contact?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <p className={cn(
                        "truncate text-xs font-semibold",
                        isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-text-primary)]",
                      )}>
                        {deal.contact?.name ?? "—"}
                      </p>
                      {unread > 0 && (
                        <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[10px] text-[var(--color-text-muted)]">{deal.title}</p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
                      <span className={cn("text-[10px]", colors.text)}>
                        {t(`stages.${deal.stage}` as Parameters<typeof t>[0])}
                      </span>
                      {deal.contact?.phone && (
                        <span className="ml-auto flex items-center gap-0.5 text-[10px] text-[var(--color-text-muted)]">
                          <Phone size={8} />
                          {deal.contact.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right panel: conversation ────────────────────────── */}
      <AnimatePresence mode="wait">
        {!selectedDeal ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]"
          >
            <div className="rounded-3xl bg-[var(--color-bg-section)] p-8">
              <MessageSquare size={36} className="opacity-20" />
            </div>
            <p className="text-sm">{t("messages.selectConversation")}</p>
          </motion.div>
        ) : (
          <motion.div
            key={selectedDeal.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-3">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm",
                AVATAR_GRADIENTS[deals.indexOf(selectedDeal) % AVATAR_GRADIENTS.length],
              )}>
                {selectedDeal.contact?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {selectedDeal.contact?.name ?? "—"}
                </p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">{selectedDeal.title}</p>
              </div>
              <a
                href={`/admin/pipeline/${selectedDeal.id}`}
                className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)]"
              >
                <ExternalLink size={11} />
                {t("messages.openDeal")}
              </a>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto bg-[var(--color-bg-section)] p-5 space-y-3">
              {loadingMsgs && (
                <p className="text-center text-sm text-[var(--color-text-muted)]">
                  {t("messages.loading")}
                </p>
              )}
              {!loadingMsgs && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-[var(--color-text-muted)]">
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <MessageSquare size={28} className="opacity-20" />
                  </div>
                  <p className="text-sm">{t("messages.noMessages")}</p>
                </div>
              )}
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn("flex", msg.sender_type === "admin" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-3 shadow-sm",
                      msg.sender_type === "admin"
                        ? "rounded-tr-sm bg-[var(--color-primary)] text-white"
                        : "rounded-tl-sm bg-white text-[var(--color-text-primary)] border border-[var(--color-border)]",
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    <p className={cn(
                      "mt-1 text-[10px]",
                      msg.sender_type === "admin" ? "text-white/60" : "text-[var(--color-text-muted)]",
                    )}>
                      {new Date(msg.created_at).toLocaleString("uk-UA", {
                        day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}
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
                  ref={textareaRef}
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={t("messages.placeholder")}
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/20 transition-shadow"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!msgContent.trim() || isPending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-40"
                  title={t("messages.send")}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
