import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export type CategoryLabels = Record<string, { uk?: string; en?: string }>;

type CategoryTable = "service_categories" | "product_categories" | "blog_categories" | "faq_categories";

async function getSupabase() {
  return createSupabaseServiceClient() ?? (await createSupabaseServerClient());
}

async function readLabels(table: CategoryTable): Promise<CategoryLabels> {
  const supabase = await getSupabase();
  if (!supabase) return {};
  const { data, error } = await supabase
    .from(table)
    .select("slug, label_uk, label_en, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data) return {};
  const result: CategoryLabels = {};
  for (const row of data) {
    result[row.slug] = { uk: row.label_uk, en: row.label_en ?? undefined };
  }
  return result;
}

export async function getServiceCategoryLabels(): Promise<CategoryLabels> {
  return readLabels("service_categories");
}

export async function getProductCategoryLabels(): Promise<CategoryLabels> {
  return readLabels("product_categories");
}

export async function getBlogCategoryLabels(): Promise<CategoryLabels> {
  return readLabels("blog_categories");
}

export async function getFaqCategoryLabelsWithFallback(): Promise<CategoryLabels> {
  return readLabels("faq_categories");
}

export async function getFaqCategoryOrderWithFallback(): Promise<string[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("faq_categories")
    .select("slug, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((row) => row.slug);
}
