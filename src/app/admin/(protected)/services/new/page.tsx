import { ServiceForm } from "@/components/admin/services/service-form";
import { getServiceCategoryLabels } from "@/lib/data/categories";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export default async function AdminServiceNewPage() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  let allCategories: string[] = [];
  const categoryLabels = await getServiceCategoryLabels();
  if (supabase) {
    const catsRes = await supabase.from("services").select("category").not("category", "is", null);
    allCategories = [...new Set((catsRes.data ?? []).map(r => r.category).filter(Boolean))];
  }
  for (const slug of Object.keys(categoryLabels)) {
    if (!allCategories.includes(slug)) allCategories.push(slug);
  }

  return <ServiceForm allCategories={allCategories} categoryLabels={categoryLabels} />;
}
