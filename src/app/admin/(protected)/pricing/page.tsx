import Link from "next/link";
import { upsertPriceFormulaAction } from "@/actions/pricing";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { getPriceFormulasForAdmin } from "@/lib/data/queries";

export default async function AdminPricingPage() {
  const formulas = await getPriceFormulasForAdmin();

  const saveFormula = async (formData: FormData) => {
    "use server";
    await upsertPriceFormulaAction(formData);
  };

  return (
    <AdminShell title="Pricing Formulas" description="Внутрішня система ціноутворення.">
      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Створити / оновити формулу
        </h2>
        <form action={saveFormula} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="id"
            placeholder="id (optional for update)"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            name="name"
            required
            placeholder="Formula name"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <select
            name="product_type"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            <option value="door">door</option>
            <option value="furniture">furniture</option>
            <option value="window">window</option>
            <option value="restoration">restoration</option>
          </select>
          <select
            name="is_active"
            defaultValue="true"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <textarea
            name="description"
            placeholder="Description"
            className="min-h-20 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            name="input_schema"
            defaultValue="[]"
            placeholder='Input schema JSON, e.g. [{"key":"width_m","type":"number"}]'
            className="min-h-24 rounded-xl border border-[var(--color-border)] px-3 py-2 font-mono text-xs md:col-span-2"
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white md:col-span-2 md:justify-self-start"
          >
            Save formula
          </button>
        </form>
      </AdminCard>

      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Формули</h2>
          <Link href="/admin/pricing/presets" className="text-sm underline">
            Preset library
          </Link>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {formulas.map((formula) => (
            <li key={formula.id} className="rounded-xl border border-[var(--color-border)] p-3">
              <Link href={`/admin/pricing/${formula.id}`} className="font-semibold underline">
                {formula.name}
              </Link>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {formula.product_type} · {formula.is_active ? "active" : "inactive"}
              </p>
            </li>
          ))}
          {formulas.length === 0 ? (
            <li className="text-sm text-[var(--color-text-secondary)]">
              Формул поки немає. Створіть першу.
            </li>
          ) : null}
        </ul>
      </AdminCard>
    </AdminShell>
  );
}
