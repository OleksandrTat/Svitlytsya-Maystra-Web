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

async function getProjectsForAssignment() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("projects")
    .select("id, title")
    .order("title", { ascending: true })
    .limit(100);

  return data ?? [];
}

async function getProductProjectMap() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return {} as Record<string, string[]>;
  }

  const { data } = await supabase.from("project_products").select("product_id, project_id");

  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    map[row.product_id] = [...(map[row.product_id] ?? []), row.project_id];
  }

  return map;
}

export default async function AdminProductsPage() {
  const [products, formulas, attributes, projects, productProjectMap] = await Promise.all([
    getAllProductsForAdmin(),
    getPriceFormulasForAdmin(),
    getProductAttributes(),
    getProjectsForAssignment(),
    getProductProjectMap(),
  ]);

  return (
    <AdminShell
      title="Продукти"
      description="Керуйте каталогом продуктів: двері, меблі, вікна та реставрація."
    >
      <AdminProductsClient
        products={products}
        formulas={formulas}
        projects={projects}
        styleAttributes={attributes.styles}
        materialAttributes={attributes.materials}
        productProjectMap={productProjectMap}
      />
    </AdminShell>
  );
}
