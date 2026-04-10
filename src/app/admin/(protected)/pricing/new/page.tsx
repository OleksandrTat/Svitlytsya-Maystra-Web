import { AdminShell } from "@/components/admin/admin-shell";
import { FormulaForm } from "@/components/admin/pricing/formula-form";
import { getPricePresetsForAdmin } from "@/lib/data/queries";

export default async function AdminPricingNewPage() {
  const presets = await getPricePresetsForAdmin();

  return (
    <AdminShell title="" bare>
      <FormulaForm presets={presets} />
    </AdminShell>
  );
}
