import { AdminShell } from "@/components/admin/admin-shell";
import { ServicesAdminClient } from "@/components/admin/services/services-admin-client";
import { createSupabaseServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";

async function getServices() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) return [];
  const { data } = await supabase.from("services").select("*").order("sort_order", { ascending: true });
  return (data ?? []).map((s: any) => ({
    ...s,
    features: Array.isArray(s.features) ? s.features : [],
    process_steps: Array.isArray(s.process_steps) ? s.process_steps : [],
  }));
}

export default async function AdminServicesPage() {
  const services = await getServices();
  return (
    <AdminShell title="Сервіси" description="Послуги компанії, що відображаються на сайті.">
      <ServicesAdminClient services={services as any} />
    </AdminShell>
  );
}
