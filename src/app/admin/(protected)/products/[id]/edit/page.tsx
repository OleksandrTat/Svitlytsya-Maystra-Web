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
        styleAttributes={attributes.styles}
        materialAttributes={attributes.materials}
      />
    </AdminShell>
  );
}
