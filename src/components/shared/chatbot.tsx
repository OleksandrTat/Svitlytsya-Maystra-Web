"use client";

import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  RotateCcw,
  ChevronRight,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitChatInquiryAction } from "@/actions/chat-inquiry";

// ─── Types ────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// ─── i18n ─────────────────────────────────────────────────

const WELCOME: Record<string, string> = {
  uk: "Привіт! 👋 Я асистент майстерні «Світлиця». Можу розповісти про послуги, продукти, ціни та умови роботи.",
  en: "Hi! 👋 I'm the Svitlytsya workshop assistant. Ask me about our products, services, pricing, or process.",
};

const CHIPS: Record<string, string[]> = {
  uk: ["Які послуги пропонуєте?", "Скільки коштують двері?", "Як замовити?", "Відгуки клієнтів"],
  en: ["What services do you offer?", "How much do doors cost?", "How to order?", "Customer reviews"],
};

const UI = {
  uk: {
    title: "Асистент Світлиці",
    subtitle: "Онлайн · готовий допомогти",
    placeholder: "Напишіть питання…",
    send: "Надіслати",
    open: "Відкрити чат",
    newChat: "Новий чат",
    error: "Щось пішло не так. Спробуйте ще раз.",
    cta: "Залишити заявку",
    poweredBy: "Відповідає на основі даних сайту",
    formTitle: "Залишити заявку",
    formName: "Ваше ім'я *",
    formPhone: "Телефон",
    formMessage: "Повідомлення",
    formSubmit: "Надіслати",
    formSubmitting: "Надсилаємо…",
    formCancel: "Скасувати",
    formNamePlaceholder: "Іван Петренко",
    formPhonePlaceholder: "+380XXXXXXXXX",
    formMessagePlaceholder: "Що вас цікавить?",
  },
  en: {
    title: "Svitlytsya Assistant",
    subtitle: "Online · ready to help",
    placeholder: "Ask a question…",
    send: "Send",
    open: "Open chat",
    newChat: "New chat",
    error: "Something went wrong. Please try again.",
    cta: "Get a quote",
    poweredBy: "Answers based on site data",
    formTitle: "Leave a request",
    formName: "Your name *",
    formPhone: "Phone",
    formMessage: "Message",
    formSubmit: "Send",
    formSubmitting: "Sending…",
    formCancel: "Cancel",
    formNamePlaceholder: "John Smith",
    formPhonePlaceholder: "+380XXXXXXXXX",
    formMessagePlaceholder: "What are you interested in?",
  },
};

const STORAGE_KEY = "svitlytsya_chat_v2";

// ─── Markdown renderer ────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex =
    /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|(\/(?:products|services|blog|contact|faq)[^\s,]*)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));

    if (match[1]) {
      parts.push(
        <strong key={match.index} className="font-semibold">
          {match[1]}
        </strong>,
      );
    } else if (match[2] && match[3]) {
      const href = match[3];
      if (href.startsWith("/")) {
        parts.push(
          <Link
            key={match.index}
            href={href as "/contact"}
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {match[2]}
          </Link>,
        );
      } else {
        parts.push(
          <a
            key={match.index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {match[2]}
          </a>,
        );
      }
    } else if (match[4]) {
      parts.push(
        <Link
          key={match.index}
          href={match[4] as "/contact"}
          className="underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {match[4]}
        </Link>,
      );
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const isBullet = /^[-•*]\s/.test(line);
    const content = isBullet ? line.replace(/^[-•*]\s/, "") : line;
    const inlineNodes = renderInline(content);

    if (isBullet) {
      nodes.push(
        <div key={li} className="flex gap-1.5 mt-0.5">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
          <span>{inlineNodes}</span>
        </div>,
      );
    } else if (line.trim() === "") {
      nodes.push(<div key={li} className="h-2" />);
    } else {
      nodes.push(<span key={li}>{inlineNodes}</span>);
      if (li < lines.length - 1 && lines[li + 1]?.trim() !== "") {
        nodes.push(<br key={`br-${li}`} />);
      }
    }
  }

  return nodes;
}

// ─── Subcomponents ────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-[var(--color-surface)] px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-muted)] [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-muted)] [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-muted)] [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex min-w-0 gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white",
          isUser ? "bg-[var(--color-primary)]" : "bg-[var(--color-accent)]",
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          "max-w-[82%] min-w-0 break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-[var(--color-primary)] text-white"
            : "rounded-tl-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]",
        )}
      >
        {isUser ? msg.content : renderMarkdown(msg.content)}
        {/* Streaming cursor */}
        {msg.content === "" && !isUser && (
          <span className="inline-block h-3.5 w-0.5 animate-pulse bg-current opacity-70 ml-0.5" />
        )}
      </div>
    </div>
  );
}

function QuickChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
    >
      {label}
      <ChevronRight className="h-3 w-3 opacity-60" />
    </button>
  );
}

// ─── Inline contact form ───────────────────────────────────

function ChatInlineForm({
  ui,
  onClose,
  onSuccess,
}: {
  ui: (typeof UI)[keyof typeof UI];
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await submitChatInquiryAction(fd);
      if (result.ok) {
        onSuccess(result.message);
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <div className="mx-2 mb-2 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
          <Phone className="h-3.5 w-3.5 text-[var(--color-primary)]" />
        </div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{ui.formTitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          name="name"
          required
          placeholder={ui.formNamePlaceholder}
          aria-label={ui.formName}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 transition"
        />
        <input
          name="phone"
          type="tel"
          placeholder={ui.formPhonePlaceholder}
          aria-label={ui.formPhone}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 transition"
        />
        <textarea
          name="message"
          rows={2}
          placeholder={ui.formMessagePlaceholder}
          aria-label={ui.formMessage}
          className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 transition"
        />

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-[var(--color-primary)] py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-60"
          >
            {isPending ? ui.formSubmitting : ui.formSubmit}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-muted)] transition hover:bg-[var(--color-bg-section)]"
          >
            {ui.formCancel}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────

export function Chatbot() {
  const locale = useLocale();
  const pathname = usePathname();
  const ui = UI[locale as keyof typeof UI] ?? UI.uk;
  const welcome = WELCOME[locale] ?? WELCOME.uk;
  const chips = CHIPS[locale] ?? CHIPS.uk;

  const welcomeMsg: Message = { id: "welcome", role: "assistant", content: welcome };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcomeMsg]);
  const [chipsUsed, setChipsUsed] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── LocalStorage persistence ──────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { messages: Message[]; chipsUsed: boolean };
        if (parsed.messages?.length) {
          setMessages(parsed.messages);
          setChipsUsed(parsed.chipsUsed ?? false);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, chipsUsed }));
    } catch {
      // ignore
    }
  }, [messages, chipsUsed]);

  // ── Scroll to bottom ─────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, suggestions, showForm]);

  // ── Focus on open ─────────────────────────────────────
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // ── Textarea auto-grow ────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  // ── Send (with streaming) ─────────────────────────────
  const send = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || loading) return;

      const userMsg: Message = { id: Date.now().toString(), role: "user", content };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setChipsUsed(true);
      setSuggestions([]);
      setShowForm(false);
      if (inputRef.current) inputRef.current.style.height = "auto";
      setLoading(true);

      // Add streaming placeholder
      const streamId = `stream-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: streamId, role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            pathname,
            messages: [...messages, userMsg]
              .filter((m) => m.id !== "welcome")
              .map(({ role, content: c }) => ({ role, content: c })),
          }),
        });

        if (!res.ok || !res.body) throw new Error("network error");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            try {
              const event = JSON.parse(raw) as {
                c?: string;
                error?: string;
                done?: boolean;
                suggestions?: string[];
                showForm?: boolean;
                reply?: string;
              };

              if (event.c) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamId ? { ...m, content: m.content + event.c } : m,
                  ),
                );
              } else if (event.reply) {
                // Non-streaming fallback (no OpenAI)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamId ? { ...m, content: event.reply! } : m,
                  ),
                );
              } else if (event.error) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamId ? { ...m, content: ui.error } : m,
                  ),
                );
              } else if (event.done) {
                setSuggestions(event.suggestions ?? []);
                setShowForm(event.showForm ?? false);
              }
            } catch {
              // malformed SSE chunk — ignore
            }
          }
        }

        if (!open) setUnread((n) => n + 1);
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamId ? { ...m, content: ui.error } : m,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [input, loading, locale, pathname, messages, open, ui.error],
  );

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const startNewChat = () => {
    setMessages([welcomeMsg]);
    setChipsUsed(false);
    setSuggestions([]);
    setShowForm(false);
    setInput("");
    localStorage.removeItem(STORAGE_KEY);
    if (inputRef.current) inputRef.current.style.height = "auto";
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleFormSuccess = (msg: string) => {
    setShowForm(false);
    setSuggestions([]);
    setMessages((prev) => [
      ...prev,
      { id: `form-success-${Date.now()}`, role: "assistant", content: msg },
    ]);
  };

  const isOnlyWelcome = messages.length === 1 && messages[0]?.id === "welcome";

  return (
    <>
      {/* ── Chat window ─────────────────────────────────── */}
      <div
        className={cn(
          "fixed bottom-24 right-4 z-50 flex w-[370px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl transition-all duration-300 md:right-6",
          open
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-4 opacity-0 pointer-events-none",
        )}
        style={{ height: "min(560px, calc(100dvh - 120px))" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-primary)] px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">{ui.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <p className="text-[11px] text-white/70">{ui.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            title={ui.newChat}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/20 hover:text-white"
            aria-label="Закрити"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-4 py-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {/* Initial quick chips */}
          {isOnlyWelcome && !chipsUsed && (
            <div className="flex flex-wrap gap-2 pt-1">
              {chips.map((chip) => (
                <QuickChip key={chip} label={chip} onClick={() => void send(chip)} />
              ))}
            </div>
          )}

          {loading && <TypingIndicator />}

          {/* Suggested follow-ups */}
          {!loading && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {suggestions.map((s) => (
                <QuickChip
                  key={s}
                  label={s}
                  onClick={() => {
                    setSuggestions([]);
                    void send(s);
                  }}
                />
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Inline form */}
        {showForm && !loading && (
          <ChatInlineForm
            ui={ui}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
          />
        )}

        {/* CTA strip */}
        {messages.length >= 3 && !loading && !showForm && (
          <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-bg-section)] px-4 py-2">
            <Link
              href="/contact"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-700)]"
            >
              {ui.cta}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3">
          <div className="flex items-end gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)]/20 transition">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKey}
              placeholder={ui.placeholder}
              disabled={loading}
              className="flex-1 resize-none bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
              style={{ maxHeight: 120, overflowY: "auto" }}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!input.trim() || loading}
              className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-40"
              aria-label={ui.send}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[var(--color-text-muted)]">
            {ui.poweredBy}
          </p>
        </div>
      </div>

      {/* ── Floating button ──────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ui.open}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg transition hover:bg-[var(--color-primary-700)] hover:scale-105 active:scale-95 md:right-6"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}
