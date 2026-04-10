import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProductsClient } from "@/components/admin/products/products-page-wrapper";
import {
  getAllProductsForAdmin,
  getPriceFormulasForAdmin,
} from "@/lib/data/queries";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

async function getProductAttributes() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return { allStyles: [] as string[], allMaterials: [] as string[], allCategories: [] as string[] };
  }

  const [attrRes, catRes] = await Promise.all([
    supabase.from("product_attributes").select("type, value").order("usage_count", { ascending: false }),
    supabase.from("products").select("category").not("category", "is", null),
  ]);

  const allStyles = [...new Set((attrRes.data ?? []).filter(r => r.type === "style").map(r => r.value))];
  const allMaterials = [...new Set((attrRes.data ?? []).filter(r => r.type === "material").map(r => r.value))];
  const allCategories = [...new Set((catRes.data ?? []).map(r => r.category).filter(Boolean))];

  return { allStyles, allMaterials, allCategories };
}

export default async function AdminProductsPage() {
  const [t, products, formulas, attributes] = await Promise.all([
    getTranslations("admin.pages.products"),
    getAllProductsForAdmin(),
    getPriceFormulasForAdmin(),
    getProductAttributes(),
  ]);

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <AdminProductsClient
        products={products}
        formulas={formulas}
      />
    </AdminShell>
  );
}
