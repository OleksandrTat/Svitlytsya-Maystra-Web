import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/products/product-form";
import { getPriceFormulasForAdmin } from "@/lib/data/queries";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

async function getProductAttributes() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) return { styles: {}, materials: {} };

  const { data } = await supabase
    .from("product_attributes")
    .select("category, type, value, usage_count")
    .order("usage_count", { ascending: false });

  const styles: Record<string, { value: string; usage_count: number }[]> = {};
  const materials: Record<string, { value: string; usage_count: number }[]> = {};

  for (const row of data ?? []) {
    if (row.type === "style") {
      styles[row.category] = [...(styles[row.category] ?? []), { value: row.value, usage_count: row.usage_count }];
    } else if (row.type === "material") {
      materials[row.category] = [...(materials[row.category] ?? []), { value: row.value, usage_count: row.usage_count }];
    }
  }

  return { styles, materials };
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
        styleAttributes={attributes.styles}
        materialAttributes={attributes.materials}
      />
    </AdminShell>
  );
}
