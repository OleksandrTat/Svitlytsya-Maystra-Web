import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/auth/is-admin";
import { env, hasOpenAi } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_CONTENT_CHARS = 12_000;
const MIN_CONTENT_CHARS = 120;
const EXCERPT_LIMIT = 220;
const SEO_TITLE_LIMIT = 60;
const SEO_DESCRIPTION_LIMIT = 160;

type AssistPayload = {
  title?: unknown;
  content?: unknown;
};

type AssistResult = {
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clampText(value: string, maxLength: number) {
  return normalizeWhitespace(value).slice(0, maxLength).trim();
}

function buildFallbackResult(title: string, plainContent: string): AssistResult {
  const excerpt = clampText(plainContent, EXCERPT_LIMIT);
  const seoDescription = clampText(plainContent, SEO_DESCRIPTION_LIMIT);

  return {
    excerpt,
    seoTitle: clampText(title || excerpt, SEO_TITLE_LIMIT),
    seoDescription,
  };
}

function parseModelResponse(raw: string): AssistResult | null {
  const normalized = raw.trim();
  if (!normalized) {
    return null;
  }

  const parseJson = (input: string) => {
    try {
      return JSON.parse(input) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const parsed =
    parseJson(normalized) ??
    (() => {
      const start = normalized.indexOf("{");
      const end = normalized.lastIndexOf("}");
      if (start === -1 || end === -1 || end <= start) {
        return null;
      }

      return parseJson(normalized.slice(start, end + 1));
    })();

  if (!parsed) {
    return null;
  }

  const excerpt = typeof parsed.excerpt === "string" ? clampText(parsed.excerpt, EXCERPT_LIMIT) : "";
  const seoTitle = typeof parsed.seoTitle === "string" ? clampText(parsed.seoTitle, SEO_TITLE_LIMIT) : "";
  const seoDescription =
    typeof parsed.seoDescription === "string"
      ? clampText(parsed.seoDescription, SEO_DESCRIPTION_LIMIT)
      : "";

  if (!excerpt || !seoTitle || !seoDescription) {
    return null;
  }

  return {
    excerpt,
    seoTitle,
    seoDescription,
  };
}

async function requestContentAssistFromModel(title: string, plainContent: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 260,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You are an SEO assistant for Ukrainian blog editors. Return only valid JSON with keys excerpt, seoTitle, seoDescription.",
        },
        {
          role: "user",
          content: [
            "Generate short Ukrainian metadata from the article content.",
            `Rules: excerpt up to ${EXCERPT_LIMIT} chars, seoTitle up to ${SEO_TITLE_LIMIT} chars, seoDescription up to ${SEO_DESCRIPTION_LIMIT} chars.`,
            "Do not add markdown. Do not include quotes around the whole result.",
            `Title: ${title || "Untitled"}`,
            `Content: ${plainContent}`,
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("AI service is temporarily unavailable.");
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
      };
    }>;
  };

  return data.choices?.[0]?.message?.content ?? "";
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminUser(user)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!hasOpenAi) {
    return NextResponse.json(
      { ok: false, message: "OPENAI_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const payload = (await request.json().catch(() => null)) as AssistPayload | null;
  const title = typeof payload?.title === "string" ? normalizeWhitespace(payload.title).slice(0, 140) : "";
  const content = typeof payload?.content === "string" ? payload.content : "";
  const plainContent = normalizeWhitespace(stripHtml(content)).slice(0, MAX_CONTENT_CHARS);

  if (plainContent.length < MIN_CONTENT_CHARS) {
    return NextResponse.json(
      { ok: false, message: "Add more content before using AI generation." },
      { status: 400 },
    );
  }

  const fallback = buildFallbackResult(title, plainContent);

  try {
    const raw = await requestContentAssistFromModel(title, plainContent);
    const parsed = parseModelResponse(raw);
    if (!parsed) {
      return NextResponse.json({ ok: true, data: fallback });
    }

    return NextResponse.json({ ok: true, data: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate text with AI.";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}
