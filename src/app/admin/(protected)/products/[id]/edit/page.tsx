import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/products/product-form";
import { getProductByIdForAdmin, getPriceFormulasForAdmin } from "@/lib/data/queries";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

async function getProductAttributes() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) return { allStyles: [], allMaterials: [], allCategories: [], categoryLabels: {}, styleTranslations: {}, materialTranslations: {} };

  const [attrRes, catRes, settingsRes] = await Promise.all([
    supabase.from("product_attributes").select("type, value").order("usage_count", { ascending: false }),
    supabase.from("products").select("category").not("category", "is", null),
    supabase.from("site_settings").select("key, value").in("key", ["product_category_labels", "style_translations", "material_translations"]),
  ]);

  const allStyles = [...new Set((attrRes.data ?? []).filter(r => r.type === "style").map(r => r.value))];
  const allMaterials = [...new Set((attrRes.data ?? []).filter(r => r.type === "material").map(r => r.value))];
  const allCategories = [...new Set((catRes.data ?? []).map(r => r.category).filter(Boolean))];
  const settingsMap = Object.fromEntries((settingsRes.data ?? []).map(r => [r.key, r.value]));

  return {
    allStyles, allMaterials, allCategories,
    categoryLabels: (settingsMap["product_category_labels"] ?? {}) as Record<string, { uk?: string; en?: string }>,
    styleTranslations: (settingsMap["style_translations"] ?? {}) as Record<string, string>,
    materialTranslations: (settingsMap["material_translations"] ?? {}) as Record<string, string>,
  };
}

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, formulas, attributes] = await Promise.all([
    getProductByIdForAdmin(id),
    getPriceFormulasForAdmin(),
    getProductAttributes(),
  ]);

  if (!product) redirect("/admin/products");

  return (
    <AdminShell title={`Редагувати: ${product.title}`} description="Редагування продукту.">
      <ProductForm
        initialData={product}
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
