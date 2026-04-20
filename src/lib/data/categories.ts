import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export type CategoryLabels = Record<string, { uk?: string; en?: string }>;

type CategoryTable = "service_categories" | "product_categories" | "blog_categories" | "faq_categories";

type SettingsKey =
  | "service_category_labels"
  | "product_category_labels"
  | "blog_category_labels"
  | "faq_category_labels"
  | "faq_category_order";

async function getSupabase() {
  return createSupabaseServiceClient() ?? (await createSupabaseServerClient());
}

async function readFromTable(table: CategoryTable): Promise<CategoryLabels | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(table)
    .select("slug, label_uk, label_en, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error || !data || data.length === 0) return null;
  const result: CategoryLabels = {};
  for (const row of data) {
    result[row.slug] = { uk: row.label_uk, en: row.label_en ?? undefined };
  }
  return result;
}

async function readFromSettings(key: SettingsKey): Promise<unknown> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}

async function getLabelsWithFallback(
  table: CategoryTable,
  settingsKey: SettingsKey,
): Promise<CategoryLabels> {
  const fromTable = await readFromTable(table);
  if (fromTable) return fromTable;
  const fromSettings = await readFromSettings(settingsKey);
  return (fromSettings ?? {}) as CategoryLabels;
}

export async function getServiceCategoryLabels(): Promise<CategoryLabels> {
  return getLabelsWithFallback("service_categories", "service_category_labels");
}

export async function getProductCategoryLabels(): Promise<CategoryLabels> {
  return getLabelsWithFallback("product_categories", "product_category_labels");
}

export async function getBlogCategoryLabels(): Promise<CategoryLabels> {
  return getLabelsWithFallback("blog_categories", "blog_category_labels");
}

export async function getFaqCategoryLabelsWithFallback(): Promise<CategoryLabels> {
  return getLabelsWithFallback("faq_categories", "faq_category_labels");
}

export async function getFaqCategoryOrderWithFallback(): Promise<string[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("faq_categories")
    .select("slug, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (data && data.length > 0) {
    return data.map((row) => row.slug);
  }
  const fromSettings = await readFromSettings("faq_category_order");
  return Array.isArray(fromSettings) ? (fromSettings as string[]) : [];
}
