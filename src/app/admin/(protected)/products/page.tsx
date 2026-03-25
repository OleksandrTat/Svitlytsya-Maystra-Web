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
    return {
      styles: {} as Record<string, { value: string; usage_count: number }[]>,
      materials: {} as Record<string, { value: string; usage_count: number }[]>,
    };
  }

  const { data } = await supabase
    .from("product_attributes")
    .select("category, type, value, usage_count")
    .order("usage_count", { ascending: false });

  const styles: Record<string, { value: string; usage_count: number }[]> = {};
  const materials: Record<string, { value: string; usage_count: number }[]> = {};

  for (const row of data ?? []) {
    if (row.type === "style") {
      styles[row.category] = [
        ...(styles[row.category] ?? []),
        { value: row.value, usage_count: row.usage_count },
      ];
    } else if (row.type === "material") {
      materials[row.category] = [
        ...(materials[row.category] ?? []),
        { value: row.value, usage_count: row.usage_count },
      ];
    }
  }

  return { styles, materials };
}

export default async function AdminProductsPage() {
  const [products, formulas, attributes] = await Promise.all([
    getAllProductsForAdmin(),
    getPriceFormulasForAdmin(),
    getProductAttributes(),
  ]);

  return (
    <AdminShell
      title="Продукти"
      description="Керування продуктами: створення, редагування, видалення та налаштування відображення на сайті."
    >
      <AdminProductsClient
        products={products}
        formulas={formulas}
        styleAttributes={attributes.styles}
        materialAttributes={attributes.materials}
      />
    </AdminShell>
  );
}
