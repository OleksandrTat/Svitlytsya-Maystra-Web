"use client";

import { useEffect, useRef, useState, useCallback, useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import {
  X,
  Send,
  User,
  Loader2,
  RotateCcw,
  ChevronRight,
  Phone,
  RefreshCw,
  Package,
  Wrench,
} from "lucide-react";

function BotAvatar({ size }: { size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      className="object-contain brightness-0 invert"
    />
  );
}
import { cn } from "@/lib/utils";
import { submitChatInquiryAction } from "@/actions/chat-inquiry";

// ─── Types ────────────────────────────────────────────────

type Message = { id: string; role: "user" | "assistant"; content: string };
type RelatedItem = { title: string; href: string; type: "product" | "service" };

// ─── Static offline FAQ ───────────────────────────────────

const STATIC_ANSWERS: Record<string, Array<{ kw: string[]; ans: string }>> = {
  uk: [
    { kw: ["ціна", "вартість", "скільки", "коштує", "коштують", "price"], ans: "Ціна розраховується індивідуально — залежить від матеріалів, розмірів та складності. Залиште заявку і ми зробимо безкоштовний розрахунок.\n\n👉 [Залишити заявку](/contact)" },
    { kw: ["двер"],                ans: "Ми виготовляємо **двері** з натуральних матеріалів (дуб, ясен, сосна). Є міжкімнатні та вхідні варіанти.\n\n👉 [Залишити заявку](/contact)" },
    { kw: ["меблі", "мебл", "стіл", "шафа", "ліжко"], ans: "Виготовляємо **меблі** на замовлення з натурального дерева — столи, шафи, ліжка, стелажі.\n\n👉 [Залишити заявку](/contact)" },
    { kw: ["вікно", "вікна"],      ans: "Виготовляємо **дерев'яні вікна** зі склопакетами. Якісні та теплі.\n\n👉 [Залишити заявку](/contact)" },
    { kw: ["термін", "скільки часу", "коли", "швидко", "строк"], ans: "Терміни залежать від складності: прості вироби — від 7 днів, складні — від 3 тижнів. Уточнюємо індивідуально." },
    { kw: ["контакт", "телефон", "зв'яз"], ans: "Зв'яжіться з нами через сторінку контактів або залиште заявку і ми передзвонимо.\n\n👉 [Контакти](/contact)" },
    { kw: ["замовити", "замовлення", "як"], ans: "Щоб замовити — залиште заявку або зателефонуйте. Ми узгодимо деталі та розрахуємо вартість.\n\n👉 [Залишити заявку](/contact)" },
  ],
  en: [
    { kw: ["price", "cost", "how much", "expensive"], ans: "Pricing is calculated individually based on materials, size, and complexity.\n\n👉 [Get a quote](/contact)" },
    { kw: ["door", "doors"],       ans: "We craft **custom doors** from natural wood (oak, ash, pine). Interior and exterior options available.\n\n👉 [Get a quote](/contact)" },
    { kw: ["furniture", "table", "wardrobe", "bed"], ans: "We make **custom furniture** from natural wood — tables, wardrobes, beds, shelving.\n\n👉 [Get a quote](/contact)" },
    { kw: ["window", "windows"],   ans: "We manufacture **wooden windows** with double-glazed units.\n\n👉 [Get a quote](/contact)" },
    { kw: ["time", "timeline", "how long", "fast"], ans: "Timelines depend on complexity: simple items from 7 days, complex pieces from 3 weeks." },
    { kw: ["contact", "phone", "call"], ans: "Contact us via the contact page or leave a request and we'll call you back.\n\n👉 [Contact](/contact)" },
    { kw: ["order", "how to"],     ans: "To order — leave a request and we'll discuss details and calculate the price.\n\n👉 [Get a quote](/contact)" },
  ],
};

function findStaticAnswer(query: string, locale: string): string {
  const list = STATIC_ANSWERS[locale] ?? STATIC_ANSWERS.uk;
  const q = query.toLowerCase();
  for (const item of list) {
    if (item.kw.some((k) => q.includes(k))) return item.ans;
  }
  return locale === "en"
    ? "I'm temporarily offline. Please leave a request and we'll get back to you.\n\n👉 [Get a quote](/contact)"
    : "Наразі я тимчасово недоступний. Залиште заявку і ми зв'яжемось з вами.\n\n👉 [Залишити заявку](/contact)";
}

// ─── i18n ─────────────────────────────────────────────────

const WELCOME: Record<string, string> = {
  uk: "Привіт! 👋 Я асистент майстерні «Світлиця». Можу розповісти про послуги, продукти, ціни та умови роботи.",
  en: "Hi! 👋 I'm the Svitlytsya workshop assistant. Ask me about our products, services, pricing, or process.",
};

const DEFAULT_CHIPS: Record<string, string[]> = {
  uk: ["Які послуги пропонуєте?", "Скільки коштують двері?", "Як замовити?", "Відгуки клієнтів"],
  en: ["What services do you offer?", "How much do doors cost?", "How to order?", "Customer reviews"],
};

const PAGE_CHIPS: Record<string, Record<string, string[]>> = {
  uk: {
    services: ["Яка орієнтовна ціна?", "Скільки часу займає?", "Який процес роботи?", "Є приклади робіт?"],
    products: ["З яких матеріалів виготовляєте?", "Чи є нестандартні розміри?", "Яка ціна?", "Як замовити?"],
    blog:     ["Які послуги надаєте?", "Як замовити?", "Є питання по матеріалах"],
    contact:  ["Скільки часу займає?", "Які послуги пропонуєте?", "Чи є знижки?"],
  },
  en: {
    services: ["What's the price range?", "How long does it take?", "Show me examples", "What's the process?"],
    products: ["What materials do you use?", "Custom sizes available?", "How to order?", "Price?"],
    blog:     ["What services do you offer?", "How to order?"],
    contact:  ["How long does it take?", "What services do you offer?"],
  },
};

function getChips(pathname: string, locale: string): string[] {
  const loc = locale === "en" ? "en" : "uk";
  if (pathname.includes("/services")) return PAGE_CHIPS[loc].services;
  if (pathname.includes("/products")) return PAGE_CHIPS[loc].products;
  if (pathname.includes("/blog"))     return PAGE_CHIPS[loc].blog;
  if (pathname.includes("/contact"))  return PAGE_CHIPS[loc].contact;
  return DEFAULT_CHIPS[loc] ?? DEFAULT_CHIPS.uk;
}

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
    offline: "⚡ Відповідь з локальної бази",
    formTitle: "Залишити заявку",
    formNamePh: "Іван Петренко",
    formPhonePh: "+380XXXXXXXXX",
    formMsgPh: "Що вас цікавить?",
    formName: "Ваше ім'я *",
    formPhone: "Телефон",
    formMsg: "Повідомлення",
    formSubmit: "Надіслати",
    formSending: "Надсилаємо…",
    formCancel: "Скасувати",
    regenerate: "Повторити",
    related: "Можливо, вас зацікавить:",
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
    offline: "⚡ Local knowledge base",
    formTitle: "Leave a request",
    formNamePh: "John Smith",
    formPhonePh: "+380XXXXXXXXX",
    formMsgPh: "What are you interested in?",
    formName: "Your name *",
    formPhone: "Phone",
    formMsg: "Message",
    formSubmit: "Send",
    formSending: "Sending…",
    formCancel: "Cancel",
    regenerate: "Retry",
    related: "You might also like:",
  },
} as const;

const STORAGE_KEY = "svitlytsya_chat_v3";

// ─── Helpers ──────────────────────────────────────────────

// Generic link labels the AI sometimes uses instead of product names
const GENERIC_LABELS = new Set([
  "детальніше", "дізнатись більше", "дізнатися більше", "тут", "тут →", "посилання",
  "more", "learn more", "details", "here", "link", "click here", "view",
  "перейти", "відкрити", "подивитись", "подивитися",
]);

function slugToTitle(slug: string): string {
  return slug
    .split("/")
    .pop()!
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractRelated(text: string): RelatedItem[] {
  const regex = /\[([^\]]+)\]\((\/(?:products|services)\/[^)]+)\)/g;
  const seen = new Set<string>();
  const items: RelatedItem[] = [];
  let m;
  while ((m = regex.exec(text)) !== null) {
    const href = m[2];
    if (seen.has(href)) continue;
    seen.add(href);
    const rawTitle = m[1].replace(/\*\*/g, "").trim();
    // If AI used a generic label, derive title from slug instead
    const title = GENERIC_LABELS.has(rawTitle.toLowerCase())
      ? slugToTitle(href)
      : rawTitle;
    items.push({
      title,
      href,
      type: href.startsWith("/services") ? "service" : "product",
    });
  }
  return items.slice(0, 3);
}

// ─── Markdown renderer ────────────────────────────────────

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|(\/(?:products|services|blog|contact|faq)[^\s,]*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) {
      parts.push(<strong key={m.index} className="font-semibold">{m[1]}</strong>);
    } else if (m[2] && m[3]) {
      const href = m[3];
      parts.push(href.startsWith("/")
        ? <Link key={m.index} href={href as "/contact"} className="underline underline-offset-2 hover:opacity-80 transition-opacity">{m[2]}</Link>
        : <a key={m.index} href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80 transition-opacity">{m[2]}</a>
      );
    } else if (m[4]) {
      parts.push(<Link key={m.index} href={m[4] as "/contact"} className="underline underline-offset-2 hover:opacity-80 transition-opacity">{m[4]}</Link>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBullet = /^[-•*]\s/.test(line);
    const content = isBullet ? line.replace(/^[-•*]\s/, "") : line;
    const inline = renderInline(content);
    if (isBullet) {
      nodes.push(
        <div key={i} className="flex gap-1.5 mt-0.5">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
          <span>{inline}</span>
        </div>
      );
    } else if (line.trim() === "") {
      nodes.push(<div key={i} className="h-2" />);
    } else {
      nodes.push(<span key={i}>{inline}</span>);
      if (i < lines.length - 1 && lines[i + 1]?.trim() !== "") {
        nodes.push(<br key={`br-${i}`} />);
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
        <BotAvatar size={16} />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-[var(--color-surface)] px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-muted)] [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-muted)] [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-muted)] [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  isLast,
  onRegenerate,
}: {
  msg: Message;
  isLast: boolean;
  onRegenerate?: () => void;
}) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("group flex min-w-0 gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white",
        isUser ? "bg-[var(--color-primary)]" : "bg-[var(--color-accent)]",
      )}>
        {isUser ? <User className="h-3.5 w-3.5" /> : <BotAvatar size={16} />}
      </div>
      <div className="flex flex-col gap-1 min-w-0 max-w-[82%]">
        <div className={cn(
          "min-w-0 break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-[var(--color-primary)] text-white"
            : "rounded-tl-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]",
        )}>
          {isUser ? msg.content : renderMarkdown(msg.content)}
        </div>
        {/* Regenerate button on last assistant message */}
        {!isUser && isLast && onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            className="flex items-center gap-1 self-start rounded-full px-2 py-1 text-[10px] text-[var(--color-text-muted)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--color-text-primary)]"
          >
            <RefreshCw className="h-2.5 w-2.5" />
          </button>
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

function RelatedCard({ item }: { item: RelatedItem }) {
  const Icon = item.type === "service" ? Wrench : Package;
  return (
    <Link
      href={item.href as "/contact"}
      className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs transition hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5"
    >
      <Icon className="h-3 w-3 shrink-0 text-[var(--color-primary)]" />
      <span className="truncate font-medium text-[var(--color-text-primary)]">{item.title}</span>
      <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-[var(--color-text-muted)]" />
    </Link>
  );
}

function ChatInlineForm({
  ui,
  recentMessages,
  onClose,
  onSuccess,
}: {
  ui: (typeof UI)[keyof typeof UI];
  recentMessages: Message[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    // Attach chat context (last 3 non-welcome messages)
    const ctx = recentMessages
      .filter((m) => m.id !== "welcome")
      .slice(-3)
      .map((m) => `${m.role === "user" ? "Клієнт" : "Асистент"}: ${m.content}`)
      .join("\n---\n");
    if (ctx) fd.set("message", `${fd.get("message") ?? ""}\n\n[Контекст чату]\n${ctx}`.trim());

    startTransition(async () => {
      const res = await submitChatInquiryAction(fd);
      if (res.ok) onSuccess(res.message);
      else setError(res.message);
    });
  };

  return (
    <div className="mx-3 mb-2 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
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
          placeholder={ui.formNamePh}
          aria-label={ui.formName}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 transition"
        />
        <input
          name="phone"
          type="tel"
          placeholder={ui.formPhonePh}
          aria-label={ui.formPhone}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 transition"
        />
        <textarea
          name="message"
          rows={2}
          placeholder={ui.formMsgPh}
          aria-label={ui.formMsg}
          className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20 transition"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-[var(--color-primary)] py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-60"
          >
            {isPending ? ui.formSending : ui.formSubmit}
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

  const welcomeMsg: Message = { id: "welcome", role: "assistant", content: welcome };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcomeMsg]);
  const [chipsUsed, setChipsUsed] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [related, setRelated] = useState<RelatedItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamContentRef = useRef("");    // accumulates streamed text
  const streamMessageIdRef = useRef<string | null>(null);
  const streamFlushFrameRef = useRef<number | null>(null);
  const assistantCountRef = useRef(0);    // total completed assistant replies
  const lastFormAtRef = useRef(-999);     // assistantCount when form last shown

  // ── Chips based on current page ───────────────────────
  const chips = getChips(pathname, locale);

  // ── LocalStorage persistence ──────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { messages: Message[]; chipsUsed: boolean; count: number };
        if (parsed.messages?.length) {
          setMessages(parsed.messages);
          setChipsUsed(parsed.chipsUsed ?? false);
          assistantCountRef.current = parsed.count ?? 0;
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        messages,
        chipsUsed,
        count: assistantCountRef.current,
      }));
    } catch { /* ignore */ }
  }, [messages, chipsUsed]);

  // ── Scroll ────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, suggestions, related, showForm]);

  // ── Focus on open ─────────────────────────────────────
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (streamFlushFrameRef.current !== null) {
        window.cancelAnimationFrame(streamFlushFrameRef.current);
      }
    };
  }, []);

  // ── Textarea auto-grow ────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const flushStreamToUi = useCallback((content?: string) => {
    const streamId = streamMessageIdRef.current;
    const nextContent = content ?? streamContentRef.current;
    if (!streamId) return;

    setStreamingId(streamId);
    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === streamId);
      if (index === -1) {
        return [...prev, { id: streamId, role: "assistant", content: nextContent }];
      }

      if (prev[index]?.content === nextContent) {
        return prev;
      }

      const next = [...prev];
      next[index] = { ...next[index], content: nextContent };
      return next;
    });
  }, []);

  const scheduleStreamFlush = useCallback(() => {
    if (streamFlushFrameRef.current !== null) return;

    streamFlushFrameRef.current = window.requestAnimationFrame(() => {
      streamFlushFrameRef.current = null;
      flushStreamToUi();
    });
  }, [flushStreamToUi]);

  // ── Core send (with streaming + offline fallback) ─────
  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setChipsUsed(true);
    setSuggestions([]);
    setRelated([]);
    setShowForm(false);
    streamContentRef.current = "";
    streamMessageIdRef.current = null;
    if (streamFlushFrameRef.current !== null) {
      window.cancelAnimationFrame(streamFlushFrameRef.current);
      streamFlushFrameRef.current = null;
    }
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);

    const streamId = `stream-${Date.now()}`;
    streamMessageIdRef.current = streamId;
    let firstChunk = true;

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

      if (!res.ok || !res.body) throw new Error("network");

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
            const ev = JSON.parse(raw) as {
              c?: string;
              reply?: string;
              error?: string;
              done?: boolean;
              suggestions?: string[];
              showForm?: boolean;
            };

            // ── text chunk ──
            if (ev.c) {
              streamContentRef.current += ev.c;
              if (firstChunk) {
                firstChunk = false;
                flushStreamToUi(streamContentRef.current);
              } else {
                scheduleStreamFlush();
              }
            }

            // ── non-streaming fallback (no OpenAI key) ──
            else if (ev.reply) {
              streamContentRef.current = ev.reply;
              firstChunk = false;
              flushStreamToUi(ev.reply);
            }

            // ── error chunk ──
            else if (ev.error && firstChunk) {
              firstChunk = false;
              const offline = findStaticAnswer(content, locale);
              streamContentRef.current = offline;
              flushStreamToUi(offline);
            }

            // ── done event ──
            else if (ev.done) {
              flushStreamToUi();
              const relItems = extractRelated(streamContentRef.current);
              setRelated(relItems);
              setSuggestions(ev.suggestions ?? []);

              // Form frequency: show when AI says so, OR every 3rd reply
              assistantCountRef.current++;
              const ac = assistantCountRef.current;
              const wantsForm = ev.showForm ?? false;
              const intervalHit = ac % 3 === 0;
              const cooldownOk = (ac - lastFormAtRef.current) >= 2;
              if ((wantsForm || intervalHit) && cooldownOk) {
                setShowForm(true);
                lastFormAtRef.current = ac;
              }
            }
          } catch { /* malformed SSE line */ }
        }
      }

      if (!open) setUnread((n) => n + 1);
    } catch {
      // Full network failure → offline static answer
      const offline = findStaticAnswer(content, locale);
      streamContentRef.current = offline;
      if (firstChunk) {
        flushStreamToUi(offline);
      } else {
        flushStreamToUi(streamContentRef.current || offline);
      }
      assistantCountRef.current++;
    } finally {
      if (streamFlushFrameRef.current !== null) {
        window.cancelAnimationFrame(streamFlushFrameRef.current);
        streamFlushFrameRef.current = null;
      }
      flushStreamToUi();
      streamMessageIdRef.current = null;
      setLoading(false);
      setStreamingId(null);
    }
  }, [flushStreamToUi, input, loading, locale, open, pathname, messages, scheduleStreamFlush]);

  // ── Regenerate last assistant reply ──────────────────
  const handleRegenerate = useCallback(() => {
    if (loading) return;
    // Find last user message
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // Remove last assistant message
    setMessages((prev) => {
      const idx = [...prev].reverse().findIndex((m) => m.role === "assistant" && m.id !== "welcome");
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      return prev.filter((_, i) => i !== realIdx);
    });
    setSuggestions([]);
    setRelated([]);
    setShowForm(false);
    void send(lastUser.content);
  }, [loading, messages, send]);

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
    setRelated([]);
    setShowForm(false);
    setInput("");
    assistantCountRef.current = 0;
    lastFormAtRef.current = -999;
    localStorage.removeItem(STORAGE_KEY);
    if (inputRef.current) inputRef.current.style.height = "auto";
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleFormSuccess = (msg: string) => {
    setShowForm(false);
    setMessages((prev) => [
      ...prev,
      { id: `form-ok-${Date.now()}`, role: "assistant", content: msg },
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
        style={{ height: "min(580px, calc(100dvh - 120px))" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-primary)] px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
            <BotAvatar size={22} />
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
          {messages.map((msg, i) => {
            const isLast = i === messages.length - 1;
            const canRegen = isLast && !loading && msg.role === "assistant" && msg.id !== "welcome" && msg.id !== streamingId;
            return (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isLast={isLast}
                onRegenerate={canRegen ? handleRegenerate : undefined}
              />
            );
          })}

          {/* Initial quick chips */}
          {isOnlyWelcome && !chipsUsed && (
            <div className="flex flex-wrap gap-2 pt-1">
              {chips.map((chip) => (
                <QuickChip key={chip} label={chip} onClick={() => void send(chip)} />
              ))}
            </div>
          )}

          {/* Typing indicator — only when loading and no streaming message yet */}
          {loading && !streamingId && <TypingIndicator />}

          {/* Related items */}
          {!loading && related.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide px-0.5">
                {ui.related}
              </p>
              {related.map((item) => (
                <RelatedCard key={item.href} item={item} />
              ))}
            </div>
          )}

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

        {/* Inline contact form */}
        {showForm && !loading && (
          <ChatInlineForm
            ui={ui}
            recentMessages={messages}
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
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
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
            <BotAvatar size={28} />
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
