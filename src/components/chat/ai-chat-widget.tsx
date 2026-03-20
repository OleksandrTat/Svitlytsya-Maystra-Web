"use client";

import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CHAT_STORAGE_MESSAGES_KEY,
  CHAT_STORAGE_SESSION_KEY,
} from "@/lib/chat/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const GREETING_MESSAGE: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Вітаю! Я цифровий помічник майстерні Svitlytsya Maystra. Підкажу по дверях, меблях, вікнах або реставрації.",
};

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeStoredMessages(value: string | null) {
  if (!value) {
    return [GREETING_MESSAGE];
  }

  try {
    const parsed = JSON.parse(value) as ChatMessage[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [GREETING_MESSAGE];
    }

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string" &&
          typeof item.id === "string",
      )
      .slice(-40);
  } catch {
    return [GREETING_MESSAGE];
  }
}

export function AIChatWidget() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string>("");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const existingSessionId = window.localStorage.getItem(CHAT_STORAGE_SESSION_KEY);
    const sessionId = existingSessionId || createSessionId();
    sessionIdRef.current = sessionId;

    if (!existingSessionId) {
      window.localStorage.setItem(CHAT_STORAGE_SESSION_KEY, sessionId);
    }

    const storedMessages = normalizeStoredMessages(
      window.localStorage.getItem(CHAT_STORAGE_MESSAGES_KEY),
    );

    setMessages(storedMessages);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(CHAT_STORAGE_MESSAGES_KEY, JSON.stringify(messages.slice(-40)));
  }, [messages]);

  useEffect(() => {
    if (!panelRef.current) {
      return;
    }

    panelRef.current.scrollTop = panelRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (!open || !panelRef.current) {
      return;
    }

    panelRef.current.scrollTop = panelRef.current.scrollHeight;
  }, [open]);

  const userMessagesCount = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages],
  );

  const onSend = async () => {
    const value = input.trim();

    if (!value || isLoading || !sessionIdRef.current) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: value,
    };

    const assistantMessageId = `assistant-${Date.now() + 1}`;
    const placeholder: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    const nextMessages = [...messages, userMessage, placeholder];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          messages: nextMessages
            .filter((message) => message.content.trim().length > 0)
            .map((message) => ({
              role: message.role,
              content: message.content,
            })),
        }),
      });

      if (!response.ok) {
        const fallbackText = await response.text();

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content:
                    fallbackText ||
                    "Вибачте, чат тимчасово недоступний. Спробуйте ще раз трохи пізніше.",
                }
              : message,
          ),
        );

        return;
      }

      if (!response.body) {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: "Не вдалося отримати відповідь. Спробуйте ще раз.",
                }
              : message,
          ),
        );

        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let assistantText = "";

      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;

        if (chunk.value) {
          assistantText += decoder.decode(chunk.value, { stream: !done });

          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content: assistantText,
                  }
                : message,
            ),
          );
        }
      }
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: "Сталася помилка мережі. Спробуйте знову пізніше.",
              }
            : message,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg transition hover:bg-[var(--color-primary-700)]"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-[var(--color-secondary)]" />
        </button>
      ) : null}

      {open ? (
        <section
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex flex-col border border-[var(--color-border)] bg-white shadow-2xl sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[520px] sm:w-[380px] sm:rounded-3xl"
        >
          <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Svitlytsya Maystra
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">AI assistant</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)]"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div ref={panelRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  message.role === "assistant"
                    ? "bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    : "ml-auto bg-[var(--color-primary)] text-white",
                )}
              >
                {message.content || (message.role === "assistant" && isLoading ? "..." : "")}
              </div>
            ))}

            {isLoading ? (
              <div className="inline-flex items-center gap-1 rounded-2xl bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-secondary)] [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-secondary)] [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-secondary)] [animation-delay:240ms]" />
              </div>
            ) : null}
          </div>

          <div className="space-y-3 border-t border-[var(--color-border)] p-4">
            {userMessagesCount >= 3 ? (
              <Link href="/contact">
                <Button className="h-10 w-full">Залишити заявку</Button>
              </Link>
            ) : null}

            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void onSend();
                  }
                }}
                placeholder="Напишіть питання..."
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-[var(--color-border)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => void onSend()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)] text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || input.trim().length === 0}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
