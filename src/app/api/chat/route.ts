import { env, hasOpenAi } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const maxDuration = 30;

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatRequest = {
  messages: ChatMessage[];
  locale?: string;
  pathname?: string;
};

// ─── Language detection ───────────────────────────────────
// Used ONLY to pick which DB translation to load (uk fields vs _en fields).
// The AI will mirror whatever language the user actually wrote in.

function detectDbLang(message: string): "uk" | "en" {
  const clean = message
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "");
  const cyrillic = (clean.match(/[\u0400-\u04FF]/g) ?? []).length;
  const latin    = (clean.match(/[a-zA-Z]/g) ?? []).length;
  if (cyrillic === 0 && latin === 0) return "uk";
  return latin > cyrillic ? "en" : "uk";
}

// ─── Context fetcher ─────────────────────────────────────

async function fetchSiteContext(locale: string) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return "";

  const isEn = locale === "en";
  const get = (obj: Record<string, unknown>, field: string): string => {
    if (isEn && obj[`${field}_en`]) return String(obj[`${field}_en`]);
    return obj[field] ? String(obj[field]) : "";
  };

  const [
    { data: products },
    { data: services },
    { data: faq },
    { data: certs },
    { data: testimonials },
    { data: company },
    { data: blog },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("title, title_en, short_description, short_description_en, category, materials, price_from, slug")
      .eq("status", "active")
      .order("sort_order")
      .limit(60),
    supabase
      .from("services")
      .select("title, title_en, tagline, tagline_en, short_description, short_description_en, price_from, price_unit, duration_days_from, duration_days_to, slug")
      .eq("is_active", true)
      .order("sort_order")
      .limit(20),
    supabase
      .from("faq_items")
      .select("question, question_en, answer, answer_en")
      .eq("is_published", true)
      .order("sort_order")
      .limit(40),
    supabase
      .from("certificates")
      .select("title, title_en, issuer, issuer_en, issued_year, description, description_en")
      .eq("is_published", true)
      .order("sort_order")
      .limit(20),
    supabase
      .from("testimonials")
      .select("author_name, author_location, content, content_en, rating")
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("company_info")
      .select("name, tagline, description, founded_year, email, phone, phone_secondary, address, city, working_hours")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("blog_posts")
      .select("title, title_en, excerpt, excerpt_en, slug, category")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(10),
  ]);

  const companyBlock = company
    ? [
        `Назва: ${company.name}`,
        company.tagline && `Слоган: ${company.tagline}`,
        company.founded_year && `Рік заснування: ${company.founded_year}`,
        company.description && `Про компанію: ${company.description}`,
        company.phone && `Телефон: ${company.phone}`,
        company.phone_secondary && `Телефон 2: ${company.phone_secondary}`,
        company.email && `Email: ${company.email}`,
        company.address && company.city && `Адреса: ${company.address}, ${company.city}`,
        company.working_hours && `Графік роботи: ${company.working_hours}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const productLines =
    products
      ?.map((p) => {
        const r = p as Record<string, unknown>;
        const title = get(r, "title");
        const desc = get(r, "short_description");
        const mats =
          Array.isArray(p.materials) && p.materials.length
            ? ` [${(p.materials as string[]).join(", ")}]`
            : "";
        const price = p.price_from ? ` · від ${p.price_from} грн` : "";
        return `- **${title}**${mats}${price}${desc ? ` — ${desc}` : ""} → /products/${p.slug}`;
      })
      .join("\n") ?? "";

  const serviceLines =
    services
      ?.map((s) => {
        const r = s as Record<string, unknown>;
        const title = get(r, "title");
        const tagline = get(r, "tagline");
        const desc = get(r, "short_description");
        const price = s.price_from
          ? ` · від ${s.price_from} ${s.price_unit ?? "грн"}`
          : "";
        const days =
          s.duration_days_from && s.duration_days_to
            ? ` · ${s.duration_days_from}–${s.duration_days_to} днів`
            : "";
        return `- **${title}**${tagline ? `: ${tagline}` : ""}${price}${days}${desc ? ` — ${desc}` : ""} → /services/${s.slug}`;
      })
      .join("\n") ?? "";

  const faqLines =
    faq
      ?.map((f) => {
        const r = f as Record<string, unknown>;
        return `Q: ${get(r, "question")}\nA: ${get(r, "answer")}`;
      })
      .join("\n\n") ?? "";

  const certLines =
    certs
      ?.map((c) => {
        const r = c as Record<string, unknown>;
        const title = get(r, "title");
        const issuer = get(r, "issuer");
        const desc = get(r, "description");
        return `- ${title} (${issuer}${c.issued_year ? `, ${c.issued_year}` : ""})${desc ? ` — ${desc}` : ""}`;
      })
      .join("\n") ?? "";

  const testimonialLines =
    testimonials
      ?.map((t) => {
        const r = t as Record<string, unknown>;
        const content = get(r, "content");
        const stars = "★".repeat(t.rating ?? 5);
        return `- ${stars} ${t.author_name}${t.author_location ? `, ${t.author_location}` : ""}: «${content}»`;
      })
      .join("\n") ?? "";

  const blogLines =
    blog
      ?.map((b) => {
        const r = b as Record<string, unknown>;
        const title = get(r, "title");
        const excerpt = get(r, "excerpt");
        return `- ${title}${excerpt ? `: ${excerpt}` : ""} → /blog/${b.slug}`;
      })
      .join("\n") ?? "";

  return [
    companyBlock && `## Про компанію\n${companyBlock}`,
    serviceLines && `## Послуги\n${serviceLines}`,
    productLines && `## Продукти\n${productLines}`,
    certLines && `## Сертифікати та нагороди\n${certLines}`,
    testimonialLines && `## Відгуки клієнтів\n${testimonialLines}`,
    faqLines && `## Часті питання (FAQ)\n${faqLines}`,
    blogLines && `## Статті в блозі\n${blogLines}`,
    `## Залишити заявку\n/contact`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

// ─── System prompt builder ────────────────────────────────

function buildSystemPrompt(
  context: string,
  pathname?: string,
) {
  const pageCtx = pathname && pathname !== "/"
    ? `\nThe user is currently viewing: ${pathname}`
    : "";

  return `You are a helpful sales assistant for Svitlytsya Maystra — a family woodworking workshop specializing in custom furniture, doors, and windows made from natural materials.

LANGUAGE RULE: Always reply in the EXACT same language the user wrote their last message in. If they write in Ukrainian — reply in Ukrainian. If in English — reply in English. If in Polish, German, French, or any other language — reply in that same language. Never switch languages unless the user does first.${pageCtx}

Guidelines:
- Be concise, warm, and professional
- Address the customer formally (e.g. "ви" in Ukrainian, "Sie" in German, "vous" in French)
- Base answers ONLY on the context below. If something is not there, say you don't have that info and suggest calling or writing us
- Never make up prices, availability, or timelines — say it's calculated individually
- When mentioning a product or service, include its link as a markdown link using the ACTUAL name as label, e.g. [Дубові двері](/products/oak-door) — NEVER use generic labels like "Детальніше", "тут", "here", "more"
- Format lists with bullet points when listing multiple items
- Use **bold** for product/service names
- When the customer asks about pricing, timelines or wants to order — end your reply with a call-to-action link to /contact in their language (e.g. "👉 [Залишити заявку](/contact)" or "👉 [Get a quote](/contact)" etc.)

---
${context}
---`;
}

// ─── SSE helper ───────────────────────────────────────────

function sseEvent(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

// ─── Suggestions fetcher ─────────────────────────────────

async function fetchSuggestions(
  fullText: string,
  lastUserMsg: string,
): Promise<{ suggestions: string[]; showForm: boolean }> {
  const prompt = `Based on the assistant's reply below, suggest 2-3 very short follow-up questions (max 7 words each). Write the questions in the SAME language as this user message: "${lastUserMsg.slice(0, 80)}". If the reply discusses pricing, timelines, or ordering, set "showForm": true. Return only JSON: {"suggestions": ["q1", "q2"], "showForm": false}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 150,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "assistant", content: fullText },
      ],
    }),
  });

  if (!res.ok) return { suggestions: [], showForm: false };

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  try {
    const parsed = JSON.parse(data.choices[0]?.message?.content ?? "{}") as {
      suggestions?: unknown;
      showForm?: unknown;
    };
    return {
      suggestions: Array.isArray(parsed.suggestions)
        ? (parsed.suggestions as string[]).slice(0, 3)
        : [],
      showForm: Boolean(parsed.showForm),
    };
  } catch {
    return { suggestions: [], showForm: false };
  }
}

// ─── POST handler ─────────────────────────────────────────

export async function POST(request: Request) {
  if (!hasOpenAi) {
    const body0 = (await request.json().catch(() => null)) as ChatRequest | null;
    const lastUser0 = body0?.messages?.findLast?.((m) => m.role === "user");
    const lang0: "uk" | "en" = lastUser0 ? detectDbLang(lastUser0.content) : "uk";
    const msg0 = lang0 === "en"
      ? "The chat assistant is currently unavailable. Please call us or leave a request at /contact"
      : "Чат-помічник наразі недоступний. Зателефонуйте нам або залиште заявку на /contact";
    return new Response(
      `data: ${JSON.stringify({ reply: msg0 })}\n\ndata: ${JSON.stringify({ done: true, suggestions: [], showForm: false })}\n\n`,
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      },
    );
  }

  const body = (await request.json().catch(() => null)) as ChatRequest | null;
  if (!body?.messages?.length) {
    return new Response("messages required", { status: 400 });
  }

  const locale = body.locale ?? "uk";
  const pathname = body.pathname;
  const history = body.messages.slice(-12);

  // Use detectDbLang only to decide which DB locale to load (uk fields vs _en fields)
  const lastUserMsg = [...history].reverse().find((m) => m.role === "user");
  const dbLang = lastUserMsg ? detectDbLang(lastUserMsg.content) : (locale === "en" ? "en" : "uk");
  const context = await fetchSiteContext(dbLang);

  const systemPrompt = buildSystemPrompt(context, pathname);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openaiRes = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.openAiApiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              temperature: 0.4,
              max_tokens: 600,
              stream: true,
              messages: [{ role: "system", content: systemPrompt }, ...history],
            }),
          },
        );

        if (!openaiRes.ok || !openaiRes.body) {
          controller.enqueue(sseEvent({ error: "AI service unavailable" }));
          controller.close();
          return;
        }

        const reader = openaiRes.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
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
            if (raw === "[DONE]") continue;
            try {
              const parsed = JSON.parse(raw) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;
                controller.enqueue(sseEvent({ c: delta }));
              }
            } catch {
              // malformed chunk — ignore
            }
          }
        }

        // Secondary call for suggestions — mirrors user's exact language
        const { suggestions, showForm } = await fetchSuggestions(
          fullText,
          lastUserMsg?.content ?? "",
        ).catch(() => ({ suggestions: [] as string[], showForm: false }));

        controller.enqueue(sseEvent({ done: true, suggestions, showForm }));
      } catch {
        controller.enqueue(sseEvent({ error: "Unexpected error" }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
