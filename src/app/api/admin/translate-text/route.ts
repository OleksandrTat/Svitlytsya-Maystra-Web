import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/is-admin";
import { env, hasOpenAi } from "@/lib/env";

/**
 * Lightweight translation endpoint — translates text without saving to DB.
 * POST { texts: string[] } → { translations: string[] }
 */
export async function POST(request: Request) {
  if (!hasOpenAi) {
    return NextResponse.json({ error: "OpenAI not configured" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { texts: string[] };
  if (!Array.isArray(body.texts) || body.texts.length === 0) {
    return NextResponse.json({ error: "texts array required" }, { status: 400 });
  }
  if (body.texts.length > 10) {
    return NextResponse.json({ error: "Max 10 texts per request" }, { status: 400 });
  }

  const translations: string[] = [];

  for (const text of body.texts) {
    if (!text?.trim()) {
      translations.push("");
      continue;
    }

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
              "You are a professional Ukrainian-to-English translator for a woodworking workshop website. Translate the given Ukrainian text to English. Preserve line breaks and formatting. Return only the translated text without any explanation.",
          },
          { role: "user", content: text },
        ],
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `OpenAI error: ${response.status}` }, { status: 502 });
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    translations.push(data.choices[0]?.message.content?.trim() ?? text);
  }

  return NextResponse.json({ translations });
}
