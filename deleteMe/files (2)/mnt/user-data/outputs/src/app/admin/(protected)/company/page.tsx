import { AdminShell } from "@/components/admin/admin-shell";
import { CompanySettingsClient } from "@/components/admin/company/company-settings-client";
import { createSupabaseServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";

async function getCompanyInfo() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) return null;
  const { data } = await supabase.from("company_info").select("*").limit(1).maybeSingle();
  return data;
}

export default async function AdminCompanyPage() {
  const company = await getCompanyInfo();
  if (!company) return <AdminShell title="Компанія" description=""><p className="text-sm text-red-600">Помилка завантаження.</p></AdminShell>;
  return (
    <AdminShell title="Компанія" description="Налаштування профілю, контактів та соціальних мереж.">
      <CompanySettingsClient company={company as any} />
    </AdminShell>
  );
}
