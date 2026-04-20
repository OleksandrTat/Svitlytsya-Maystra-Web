import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/products/product-form";
import { getProductByIdForAdmin, getPriceFormulasForAdmin } from "@/lib/data/queries";
import { getProductCategoryLabels } from "@/lib/data/categories";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

async function getProductAttributes() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  const categoryLabels = await getProductCategoryLabels();
  if (!supabase) {
    return {
      allStyles: [] as string[],
      allMaterials: [] as string[],
      allCategories: Object.keys(categoryLabels),
      categoryLabels,
      styleTranslations: {} as Record<string, string>,
      materialTranslations: {} as Record<string, string>,
    };
  }

  const [matRes, styleRes, catRes] = await Promise.all([
    supabase.from("materials").select("slug, label_en").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("styles").select("slug, label_en").eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("products").select("category").not("category", "is", null),
  ]);

  const allMaterials = (matRes.data ?? []).map((r) => r.slug);
  const allStyles = (styleRes.data ?? []).map((r) => r.slug);
  const allCategories = [...new Set((catRes.data ?? []).map((r) => r.category).filter(Boolean))];
  for (const slug of Object.keys(categoryLabels)) {
    if (!allCategories.includes(slug)) allCategories.push(slug);
  }

  const materialTranslations: Record<string, string> = {};
  for (const r of matRes.data ?? []) {
    if (r.label_en) materialTranslations[r.slug] = r.label_en;
  }
  const styleTranslations: Record<string, string> = {};
  for (const r of styleRes.data ?? []) {
    if (r.label_en) styleTranslations[r.slug] = r.label_en;
  }

  return { allStyles, allMaterials, allCategories, categoryLabels, styleTranslations, materialTranslations };
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
