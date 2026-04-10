import { ServiceForm } from "@/components/admin/services/service-form";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export default async function AdminServiceNewPage() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  let allCategories: string[] = [];
  let categoryLabels: Record<string, { uk?: string; en?: string }> = {};
  if (supabase) {
    const [catsRes, settingsRes] = await Promise.all([
      supabase.from("services").select("category").not("category", "is", null),
      supabase.from("site_settings").select("key, value").eq("key", "service_category_labels").maybeSingle(),
    ]);
    allCategories = [...new Set((catsRes.data ?? []).map(r => r.category).filter(Boolean))];
    categoryLabels = (settingsRes.data?.value ?? {}) as Record<string, { uk?: string; en?: string }>;
  }

  return <ServiceForm allCategories={allCategories} categoryLabels={categoryLabels} />;
}
