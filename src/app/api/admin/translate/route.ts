import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/is-admin";
import { env, hasOpenAi } from "@/lib/env";

type TranslateRequest = {
  table: "products" | "services" | "blog_posts" | "faq_items" | "certificates";
  id: string;
  fields: Record<string, string>;
};

const TABLE_EN_FIELDS: Record<string, string[]> = {
  products: ["title", "description", "short_description", "seo_title", "seo_description"],
  services: ["title", "tagline", "short_description", "description", "seo_title", "seo_description", "features", "process_steps"],
  blog_posts: ["title", "excerpt", "content", "seo_title", "seo_description"],
  faq_items: ["question", "answer"],
  certificates: ["title", "description", "issuer"],
};

// Fields that are JSONB arrays — require structure-aware translation
const JSON_ARRAY_FIELDS = new Set(["features", "process_steps"]);

async function callOpenAI(systemPrompt: string, userContent: string, maxTokens = 2048): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message.content?.trim() ?? "";
}

async function translateText(text: string): Promise<string> {
  return callOpenAI(
    "You are a professional Ukrainian-to-English translator for a woodworking workshop website. Translate the given Ukrainian text to English. Preserve HTML markup, line breaks, and markdown formatting. Return only the translated text without any explanation.",
    text,
  );
}

async function translateJsonArray(json: string): Promise<unknown[]> {
  const raw = await callOpenAI(
    "You are a professional Ukrainian-to-English translator for a woodworking workshop website. You will receive a JSON array of objects. Translate only the string values (fields like title, description) from Ukrainian to English. Keep all other fields (numbers, etc.) unchanged. Return only valid JSON array without any explanation or markdown.",
    json,
    3000,
  );

  // Strip possible markdown code fences
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const parsed: unknown = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  if (!hasOpenAi) {
    return NextResponse.json({ error: "OpenAI not configured" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as TranslateRequest;
  const { table, id, fields } = body;

  if (!TABLE_EN_FIELDS[table]) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  // Translate each field
  const translations: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!value || !value.trim()) continue;
    if (JSON_ARRAY_FIELDS.has(key)) {
      translations[`${key}_en`] = await translateJsonArray(value);
    } else {
      translations[`${key}_en`] = await translateText(value);
    }
  }

  // Upsert into the table
  const { error } = await supabase.from(table).update(translations).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, translations: translations as Record<string, unknown> });
}
