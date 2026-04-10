import { redirect } from "next/navigation";
import { ServiceForm } from "@/components/admin/services/service-form";
import { getServiceByIdForAdmin } from "@/lib/data/queries";
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
  let categoryLabels: Record<string, { uk?: string; en?: string }> = {};

  const [service] = await Promise.all([
    getServiceByIdForAdmin(id),
    (async () => {
      if (!supabase) return;
      const [catsRes, settingsRes] = await Promise.all([
        supabase.from("services").select("category").not("category", "is", null),
        supabase.from("site_settings").select("key, value").eq("key", "service_category_labels").maybeSingle(),
      ]);
      allCategories = [...new Set((catsRes.data ?? []).map(r => r.category).filter(Boolean))];
      categoryLabels = (settingsRes.data?.value ?? {}) as Record<string, { uk?: string; en?: string }>;
    })(),
  ]);

  if (!service) {
    redirect("/admin/services");
  }

  return <ServiceForm initialData={service} allCategories={allCategories} categoryLabels={categoryLabels} />;
}
