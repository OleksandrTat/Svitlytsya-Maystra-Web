import { AdminShell } from "@/components/admin/admin-shell";
import AdminProjectsClient from "@/components/admin/projects/projects-client";
import {
  getAllProductsForAdmin,
  getAllProjectsForAdmin,
  getClientsForAdmin,
} from "@/lib/data/queries";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

async function getProjectProductMap() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return {} as Record<string, string[]>;
  }

  const { data } = await supabase.from("project_products").select("project_id, product_id");

  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    map[row.project_id] = [...(map[row.project_id] ?? []), row.product_id];
  }

  return map;
}

export default async function AdminProjectsPage() {
  const [projects, clients, products, projectProductMap] = await Promise.all([
    getAllProjectsForAdmin(),
    getClientsForAdmin(500),
    getAllProductsForAdmin(),
    getProjectProductMap(),
  ]);

  return (
    <AdminShell
      title="Проєкти"
      description="Каталог виконаних робіт: керуйте фото, описами, клієнтами та продуктами."
    >
      <AdminProjectsClient
        projects={projects}
        clients={clients}
        availableProducts={products}
        projectProductMap={projectProductMap}
      />
    </AdminShell>
  );
}
