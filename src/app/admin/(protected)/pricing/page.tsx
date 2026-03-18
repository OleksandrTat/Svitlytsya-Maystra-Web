import { AdminShell } from "@/components/admin/admin-shell";
import { PricingPageClient } from "@/components/admin/pricing/pricing-page-client";
import {
  getAllFormulaComponentsForAdmin,
  getPriceFormulasForAdmin,
  getPricePresetsForAdmin,
} from "@/lib/data/queries";

export default async function AdminPricingPage() {
  const [formulas, presets, allComponents] = await Promise.all([
    getPriceFormulasForAdmin(),
    getPricePresetsForAdmin(),
    getAllFormulaComponentsForAdmin(),
  ]);

  const version = [
    ...formulas.map((formula) => formula.updated_at),
    ...presets.map((preset) => preset.updated_at),
    ...allComponents.map((component) => component.updated_at),
  ]
    .sort()
    .at(-1) ?? "empty";

  const formulaComponentsMap = allComponents.reduce<Record<string, typeof allComponents>>(
    (accumulator, component) => {
      accumulator[component.formula_id] = [
        ...(accumulator[component.formula_id] ?? []),
        component,
      ];
      return accumulator;
    },
    {},
  );

  return (
    <AdminShell
      title="Ціноутворення"
      description="Формули розрахунку та бібліотека змінних для калькуляторів продуктів."
    >
      <PricingPageClient
        key={version}
        formulas={formulas}
        presets={presets}
        formulaComponentsMap={formulaComponentsMap}
      />
    </AdminShell>
  );
}
