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
  services: ["title", "tagline", "short_description", "description", "seo_title", "seo_description"],
  blog_posts: ["title", "excerpt", "content", "seo_title", "seo_description"],
  faq_items: ["question", "answer"],
  certificates: ["title", "description", "issuer"],
};

async function translateText(text: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional Ukrainian-to-English translator for a woodworking workshop website. Translate the given Ukrainian text to English. Preserve HTML markup, line breaks, and markdown formatting. Return only the translated text without any explanation.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 2048,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message.content?.trim() ?? text;
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
  const translations: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value && value.trim()) {
      translations[`${key}_en`] = await translateText(value);
    }
  }

  // Upsert into the table
  const { error } = await supabase.from(table).update(translations).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, translations });
}
