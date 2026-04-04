import { NextResponse } from "next/server";
import { env, hasOpenAi } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequest = {
  messages: ChatMessage[];
  locale?: string;
};

type ContactSettings = {
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
};

async function fetchSiteContext(locale: string) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return "";

  const isEn = locale === "en";

  const [{ data: products }, { data: services }, { data: faq }, { data: settings }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, title, title_en, category, price_from, slug")
        .eq("status", "active")
        .limit(50),
      supabase
        .from("services")
        .select("id, title, title_en, tagline, tagline_en, slug")
        .eq("status", "active")
        .limit(20),
      supabase
        .from("faq_items")
        .select("question, question_en, answer, answer_en")
        .eq("is_published", true)
        .limit(30),
      supabase
        .from("site_settings")
        .select("key, value")
        .eq("key", "contacts")
        .maybeSingle(),
    ]);

  const getField = (obj: Record<string, unknown>, field: string) => {
    if (isEn && obj[`${field}_en`]) return String(obj[`${field}_en`]);
    return obj[field] ? String(obj[field]) : "";
  };

  const productLines =
    products
      ?.map((p) => {
        const title = getField(p as Record<string, unknown>, "title");
        const price = p.price_from ? ` (від ${p.price_from} грн)` : "";
        return `- ${title} [${p.category}]${price} → /products/${p.slug}`;
      })
      .join("\n") ?? "";

  const serviceLines =
    services
      ?.map((s) => {
        const title = getField(s as Record<string, unknown>, "title");
        const tagline = getField(s as Record<string, unknown>, "tagline");
        return `- ${title}${tagline ? `: ${tagline}` : ""} → /services/${s.slug}`;
      })
      .join("\n") ?? "";

  const faqLines =
    faq
      ?.map((f) => {
        const q = getField(f as Record<string, unknown>, "question");
        const a = getField(f as Record<string, unknown>, "answer");
        return `Q: ${q}\nA: ${a}`;
      })
      .join("\n\n") ?? "";

  const contacts = settings?.value as ContactSettings | undefined;
  const contactLines = contacts
    ? [
        contacts.phone && `Телефон: ${contacts.phone}`,
        contacts.email && `Email: ${contacts.email}`,
        contacts.address && `Адреса: ${contacts.address}`,
        contacts.hours && `Графік: ${contacts.hours}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return [
    productLines && `## Продукти\n${productLines}`,
    serviceLines && `## Послуги\n${serviceLines}`,
    faqLines && `## FAQ\n${faqLines}`,
    contactLines && `## Контакти\n${contactLines}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildSystemPrompt(context: string, locale: string) {
  const isUk = locale !== "en";
  const lang = isUk
    ? "Відповідай ВИКЛЮЧНО українською мовою."
    : "Always reply in English.";

  return `You are a helpful assistant for Svitlytsya Maystra — a family woodworking workshop with 26+ years of experience making custom furniture, doors, and windows from natural materials.

${lang}

Your role: answer questions about our products, services, pricing, process, and contacts based ONLY on the information below. If something is not in the context, say you don't know and suggest contacting us directly.

Keep answers concise and friendly. When mentioning products or services, include a link like /products/slug.

Never make up prices or availability. If pricing is not listed, say it's calculated individually after consultation.

---
${context}
---

Contact page: /contact
Quote form: /contact`;
}

export async function POST(request: Request) {
  if (!hasOpenAi) {
    return NextResponse.json({ error: "Chat is not available." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as ChatRequest | null;
  if (!body?.messages?.length) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const locale = body.locale ?? "uk";

  // Limit history to last 10 messages to save tokens
  const history = body.messages.slice(-10);

  const context = await fetchSiteContext(locale);
  const systemPrompt = buildSystemPrompt(context, locale);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
      ],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const reply = data.choices[0]?.message?.content?.trim() ?? "";
  return NextResponse.json({ reply });
}
