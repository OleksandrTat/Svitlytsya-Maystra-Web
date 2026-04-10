import { redirect } from "next/navigation";
import { FormulaForm } from "@/components/admin/pricing/formula-form";
import {
  getFormulaComponentsForAdmin,
  getPriceFormulaByIdForAdmin,
  getPricePresetsForAdmin,
} from "@/lib/data/queries";

export default async function AdminPricingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [formula, components, presets] = await Promise.all([
    getPriceFormulaByIdForAdmin(id),
    getFormulaComponentsForAdmin(id),
    getPricePresetsForAdmin(),
  ]);

  if (!formula) {
    redirect("/admin/pricing");
  }

  return <FormulaForm initialData={formula} initialComponents={components} presets={presets} />;
}
