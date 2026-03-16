import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { CHAT_MAX_CONTEXT_MESSAGES, CHAT_MAX_TOKENS } from "@/lib/chat/constants";
import { getChatSystemPrompt } from "@/lib/data/queries";
import { env, hasOpenAi } from "@/lib/env";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type ChatRole = Database["public"]["Enums"]["chat_role"];
type InputMessage = { role: ChatRole; content: string };

const RUSSIAN_LETTERS_RE = /[ЁёЫыЭэЪъ]/;

export const dynamic = "force-dynamic";

function isChatRole(value: unknown): value is ChatRole {
  return value === "user" || value === "assistant";
}

function normalizeMessages(value: unknown): InputMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is { role: unknown; content: unknown } =>
        Boolean(item) && typeof item === "object" && "role" in item && "content" in item,
    )
    .map((item) => ({
      role: isChatRole(item.role) ? item.role : "user",
      content: typeof item.content === "string" ? item.content.trim() : "",
    }))
    .filter((item) => item.content.length > 0)
    .slice(-CHAT_MAX_CONTEXT_MESSAGES);
}

function approximateTokenCount(content: string) {
  return Math.max(1, Math.ceil(content.length / 4));
}

function detectLanguage(text: string) {
  if (RUSSIAN_LETTERS_RE.test(text)) {
    return "ru";
  }

  if (/[А-Яа-яІіЇїЄєҐґ]/.test(text)) {
    return "uk";
  }

  if (/[A-Za-z]/.test(text)) {
    return "en";
  }

  return "unknown";
}

async function moderateInput(input: string) {
  if (!hasOpenAi) {
    return { allowed: true };
  }

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input,
      }),
    });
  } catch {
    return { allowed: true };
  }

  if (!response.ok) {
    return { allowed: true };
  }

  const result = (await response.json()) as {
    results?: Array<{ flagged?: boolean }>;
  };

  return {
    allowed: !result.results?.[0]?.flagged,
  };
}

async function* readOpenAITextStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const lines = event.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) {
          continue;
        }

        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") {
          continue;
        }

        let parsed: {
          choices?: Array<{
            delta?: {
              content?: string;
            };
          }>;
        };

        try {
          parsed = JSON.parse(payload);
        } catch {
          continue;
        }

        const token = parsed.choices?.[0]?.delta?.content;
        if (token) {
          yield token;
        }
      }
    }
  }
}

async function getCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

async function saveChatExchange(params: {
  sessionId: string;
  userMessage: string;
  assistantMessage: string;
  language: string;
}) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return;
  }

  const userId = await getCurrentUserId();
  const nowIso = new Date().toISOString();

  const { data: existingSession } = await supabase
    .from("ai_chat_sessions")
    .select("id")
    .eq("session_id", params.sessionId)
    .maybeSingle();

  let chatSessionId = existingSession?.id ?? null;

  if (!chatSessionId) {
    const { data: createdSession } = await supabase
      .from("ai_chat_sessions")
      .insert({
        session_id: params.sessionId,
        user_id: userId,
        language: params.language,
        created_at: nowIso,
        last_message_at: nowIso,
      })
      .select("id")
      .single();

    chatSessionId = createdSession?.id ?? null;
  } else {
    await supabase
      .from("ai_chat_sessions")
      .update({
        user_id: userId,
        language: params.language,
        last_message_at: nowIso,
      })
      .eq("id", chatSessionId);
  }

  if (!chatSessionId) {
    return;
  }

  await supabase.from("ai_chat_messages").insert([
    {
      chat_session_id: chatSessionId,
      role: "user",
      content: params.userMessage,
      tokens_used: approximateTokenCount(params.userMessage),
      created_at: nowIso,
    },
    {
      chat_session_id: chatSessionId,
      role: "assistant",
      content: params.assistantMessage,
      tokens_used: approximateTokenCount(params.assistantMessage),
      created_at: nowIso,
    },
  ]);
}

export async function POST(request: Request) {
  if (!hasOpenAi) {
    return NextResponse.json(
      { ok: false, message: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        session_id?: unknown;
        messages?: unknown;
      }
    | null;

  const sessionId =
    typeof body?.session_id === "string" ? body.session_id.trim().slice(0, 128) : "";
  const messages = normalizeMessages(body?.messages);

  if (!sessionId || messages.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Invalid payload. Expected session_id and messages." },
      { status: 400 },
    );
  }

  const allowed = await checkRateLimit(`chat:${sessionId}`);
  if (!allowed) {
    return NextResponse.json(
      { ok: false, message: "Rate limit exceeded. Try again in 1 minute." },
      { status: 429 },
    );
  }

  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUserMessage) {
    return NextResponse.json(
      { ok: false, message: "Missing user message." },
      { status: 400 },
    );
  }

  if (RUSSIAN_LETTERS_RE.test(lastUserMessage.content)) {
    const refusal =
      "Вибачте, я не обслуговую запити російською мовою. Напишіть, будь ласка, українською або іншою мовою.";

    await saveChatExchange({
      sessionId,
      userMessage: lastUserMessage.content,
      assistantMessage: refusal,
      language: "ru",
    });

    return new Response(refusal, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const moderation = await moderateInput(lastUserMessage.content);
  if (!moderation.allowed) {
    const responseText =
      "Вибачте, я не можу відповісти на цей запит. Будь ласка, сформулюйте питання інакше.";

    await saveChatExchange({
      sessionId,
      userMessage: lastUserMessage.content,
      assistantMessage: responseText,
      language: detectLanguage(lastUserMessage.content),
    });

    return new Response(responseText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const systemPrompt = await getChatSystemPrompt();
  let openAIResponse: Response;
  try {
    openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        stream: true,
        max_tokens: CHAT_MAX_TOKENS,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
      }),
    });
  } catch {
    const fallback =
      "Наразі чат недоступний. Будь ласка, залиште заявку через форму, і ми зв'яжемося з вами.";

    await saveChatExchange({
      sessionId,
      userMessage: lastUserMessage.content,
      assistantMessage: fallback,
      language: detectLanguage(lastUserMessage.content),
    });

    return new Response(fallback, {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  if (!openAIResponse.ok || !openAIResponse.body) {
    const fallback =
      "Наразі чат недоступний. Будь ласка, залиште заявку через форму, і ми зв'яжемося з вами.";

    await saveChatExchange({
      sessionId,
      userMessage: lastUserMessage.content,
      assistantMessage: fallback,
      language: detectLanguage(lastUserMessage.content),
    });

    return new Response(fallback, {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const requestHeaders = await headers();
  const responseLanguage =
    requestHeaders.get("accept-language")?.split(",")[0]?.trim() ??
    detectLanguage(lastUserMessage.content);

  const encoder = new TextEncoder();
  let assistantText = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const token of readOpenAITextStream(openAIResponse.body!)) {
          assistantText += token;
          controller.enqueue(encoder.encode(token));
        }
      } catch {
        if (!assistantText) {
          assistantText =
            "Виникла технічна помилка. Будь ласка, спробуйте ще раз або залиште заявку.";
          controller.enqueue(encoder.encode(assistantText));
        }
      } finally {
        controller.close();
        await saveChatExchange({
          sessionId,
          userMessage: lastUserMessage.content,
          assistantMessage: assistantText || "No response generated.",
          language: responseLanguage,
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
