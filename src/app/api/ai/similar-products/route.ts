import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { env, hasOpenAi } from "@/lib/env";

export async function POST(request: Request) {
  if (!hasOpenAi) {
    return NextResponse.json({ ok: false, message: "OpenAI not configured." }, { status: 500 });
  }

  const { query } = (await request.json().catch(() => ({ query: null }))) as {
    query: string | null;
  };

  if (!query?.trim()) {
    return NextResponse.json({ ok: false, message: "query is required." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: products } = supabase
    ? await supabase
        .from("products")
        .select("id, title, slug, description, category, materials, style, price_from, cover_image")
        .eq("status", "active")
        .limit(30)
    : { data: [] };

  if (!products || products.length === 0) {
    return NextResponse.json({ ok: true, products: [] });
  }

  const productList = products
    .map((product, index) => `${index + 1}. ${product.title} (${product.category}) — ${product.description.slice(0, 80)}`)
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "You are a product matching assistant. Given a user query and a product list, return the IDs (1-based numbers) of the 3 most relevant products as a JSON array. Return ONLY valid JSON like: {\"matches\": [1, 3, 7]}",
        },
        {
          role: "user",
          content: `User query: "${query}"\n\nProducts:\n${productList}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ ok: true, products: products.slice(0, 3) });
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const raw = data.choices?.[0]?.message?.content ?? "";
  let matchedProducts = products.slice(0, 3);

  try {
    const parsed = JSON.parse(raw) as { matches?: number[] };
    if (Array.isArray(parsed.matches)) {
      matchedProducts = parsed.matches
        .filter((index: number) => index >= 1 && index <= products.length)
        .map((index: number) => products[index - 1]!)
        .filter(Boolean);
    }
  } catch {
    // fallback to first 3
  }

  return NextResponse.json({ ok: true, products: matchedProducts });
}
