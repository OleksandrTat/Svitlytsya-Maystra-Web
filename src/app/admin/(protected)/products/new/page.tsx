import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/products/product-form";
import { getPriceFormulasForAdmin } from "@/lib/data/queries";
import { getProductCategoryLabels } from "@/lib/data/categories";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

async function getProductAttributes() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  const categoryLabels = await getProductCategoryLabels();
  if (!supabase) return { allStyles: [], allMaterials: [], allCategories: Object.keys(categoryLabels), categoryLabels, styleTranslations: {}, materialTranslations: {} };

  const [attrRes, catRes, settingsRes] = await Promise.all([
    supabase.from("product_attributes").select("type, value").order("usage_count", { ascending: false }),
    supabase.from("products").select("category").not("category", "is", null),
    supabase.from("site_settings").select("key, value").in("key", ["style_translations", "material_translations"]),
  ]);

  const allStyles = [...new Set((attrRes.data ?? []).filter(r => r.type === "style").map(r => r.value))];
  const allMaterials = [...new Set((attrRes.data ?? []).filter(r => r.type === "material").map(r => r.value))];
  const allCategories = [...new Set((catRes.data ?? []).map(r => r.category).filter(Boolean))];
  for (const slug of Object.keys(categoryLabels)) {
    if (!allCategories.includes(slug)) allCategories.push(slug);
  }
  const settingsMap = Object.fromEntries((settingsRes.data ?? []).map(r => [r.key, r.value]));

  return {
    allStyles, allMaterials, allCategories, categoryLabels,
    styleTranslations: (settingsMap["style_translations"] ?? {}) as Record<string, string>,
    materialTranslations: (settingsMap["material_translations"] ?? {}) as Record<string, string>,
  };
}

export default async function AdminProductNewPage() {
  const [formulas, attributes] = await Promise.all([
    getPriceFormulasForAdmin(),
    getProductAttributes(),
  ]);

  return (
    <AdminShell title="Новий продукт" description="Створіть новий продукт.">
      <ProductForm
        formulas={formulas}
        allStyles={attributes.allStyles}
        allMaterials={attributes.allMaterials}
        allCategories={attributes.allCategories}
        categoryLabels={attributes.categoryLabels}
        styleTranslations={attributes.styleTranslations}
        materialTranslations={attributes.materialTranslations}
      />
    </AdminShell>
  );
}
