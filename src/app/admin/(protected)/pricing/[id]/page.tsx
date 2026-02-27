import Link from "next/link";
import { addFormulaComponentAction } from "@/actions/pricing";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  getFormulaComponentsForAdmin,
  getPriceFormulasForAdmin,
  getPricePresetsForAdmin,
} from "@/lib/data/queries";

type Params = {
  id: string;
};

export default async function AdminPricingFormulaDetailsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const [formulas, components, presets] = await Promise.all([
    getPriceFormulasForAdmin(),
    getFormulaComponentsForAdmin(id),
    getPricePresetsForAdmin(),
  ]);

  const formula = formulas.find((item) => item.id === id) ?? null;

  const addComponent = async (formData: FormData) => {
    "use server";
    await addFormulaComponentAction(formData);
  };

  if (!formula) {
    return (
      <AdminShell title="Formula Not Found">
        <AdminCard>
          <p className="text-sm text-[var(--color-text-secondary)]">Formula does not exist.</p>
          <Link href="/admin/pricing" className="mt-3 inline-block text-sm underline">
            Back to formulas
          </Link>
        </AdminCard>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={formula.name} description={`Product type: ${formula.product_type}`}>
      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Add component</h2>
        <form action={addComponent} className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="formula_id" value={formula.id} />
          <select name="type" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm">
            <option value="material">material</option>
            <option value="consumable">consumable</option>
            <option value="labor">labor</option>
            <option value="overhead">overhead</option>
            <option value="tax">tax</option>
            <option value="margin">margin</option>
          </select>
          <input
            name="label"
            required
            placeholder="Label"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <select name="preset_id" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm">
            <option value="">No preset</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <input
            name="sort_order"
            type="number"
            defaultValue={components.length}
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            name="expression"
            required
            placeholder="Expression, e.g. preset_value * width * height"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          />
          <input
            name="condition"
            placeholder="Condition, e.g. glass == true"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white md:col-span-2 md:justify-self-start"
          >
            Add component
          </button>
        </form>
      </AdminCard>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Components</h2>
        <ol className="mt-4 space-y-2 text-sm">
          {components.map((component) => (
            <li key={component.id} className="rounded-xl border border-[var(--color-border)] p-3">
              <p className="font-semibold">{component.label}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {component.type} · sort: {component.sort_order}
              </p>
              <p className="mt-1 font-mono text-xs">{component.expression}</p>
              {component.condition ? (
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  condition: {component.condition}
                </p>
              ) : null}
            </li>
          ))}
          {components.length === 0 ? (
            <li className="text-sm text-[var(--color-text-secondary)]">
              Немає компонентів. Додайте перший елемент формули.
            </li>
          ) : null}
        </ol>
      </AdminCard>
    </AdminShell>
  );
}
