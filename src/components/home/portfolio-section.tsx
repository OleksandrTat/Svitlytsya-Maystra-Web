import { createSupabaseServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import type { Product } from "@/lib/types";
import { PortfolioGrid } from "@/components/home/portfolio-grid";

async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) return [];

  const { data } = await supabase
    .from("products")
    .select("id, title, slug, category, cover_image, images, is_featured, sort_order, status, description, short_description, materials, style, price_from, formula_id, model_3d_url, seo_title, seo_description, created_at, updated_at, title_en, description_en, short_description_en, seo_title_en, seo_description_en")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(8);

  return (data ?? []) as Product[];
}

export async function PortfolioSection() {
  const [products, t] = await Promise.all([
    getFeaturedProducts(),
    getTranslations("home.portfolio"),
  ]);

  return <PortfolioGrid products={products} t={{ eyebrow: t("eyebrow"), title: t("title"), all: t("all"), viewAll: t("viewAll") }} />;
}
