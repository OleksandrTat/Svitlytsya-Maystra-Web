import { redirect } from "next/navigation";
import { ServiceForm } from "@/components/admin/services/service-form";
import { getServiceByIdForAdmin } from "@/lib/data/queries";
import { getServiceCategoryLabels } from "@/lib/data/categories";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export default async function AdminServiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  let allCategories: string[] = [];

  const [service, categoryLabels] = await Promise.all([
    getServiceByIdForAdmin(id),
    getServiceCategoryLabels(),
    (async () => {
      if (!supabase) return;
      const catsRes = await supabase.from("services").select("category").not("category", "is", null);
      allCategories = [...new Set((catsRes.data ?? []).map(r => r.category).filter(Boolean))];
    })(),
  ]);

  for (const slug of Object.keys(categoryLabels)) {
    if (!allCategories.includes(slug)) allCategories.push(slug);
  }

  if (!service) {
    redirect("/admin/services");
  }

  return <ServiceForm initialData={service} allCategories={allCategories} categoryLabels={categoryLabels} />;
}
