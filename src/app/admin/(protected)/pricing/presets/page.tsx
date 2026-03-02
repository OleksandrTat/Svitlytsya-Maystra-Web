import { upsertPricePresetAction } from "@/actions/pricing";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { InlinePriceCell } from "@/components/admin/pricing/inline-price-cell";
import { getPricePresetsForAdmin } from "@/lib/data/queries";

export default async function AdminPricingPresetsPage() {
  const presets = await getPricePresetsForAdmin();

  const savePreset = async (formData: FormData) => {
    "use server";
    await upsertPricePresetAction(formData);
  };

  return (
    <AdminShell
      title="Preset Library"
      description="Бібліотека цінових заготовок для формул. Клікніть по значенню в таблиці для inline-редагування."
    >
      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Створити / оновити preset</h2>
        <form action={savePreset} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="id"
            placeholder="id (optional for update)"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            name="name"
            required
            placeholder="Preset name"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <select
            name="category"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            <option value="material">material</option>
            <option value="consumable">consumable</option>
            <option value="labor">labor</option>
            <option value="overhead">overhead</option>
          </select>
          <input
            name="unit"
            required
            placeholder="Unit (м², кг, год)"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            name="value"
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="Value"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            name="currency"
            defaultValue="UAH"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <textarea
            name="notes"
            placeholder="Notes"
            className="min-h-20 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white md:col-span-2 md:justify-self-start"
          >
            Save preset
          </button>
        </form>
      </AdminCard>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Presets</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2 text-right">Value</th>
                <th className="px-2 py-2 text-right">Currency</th>
                <th className="px-2 py-2 text-right">Unit</th>
              </tr>
            </thead>
            <tbody>
              {presets.map((preset) => (
                <tr key={preset.id} className="border-b border-[var(--color-border)]/60">
                  <td className="px-2 py-2">{preset.name}</td>
                  <td className="px-2 py-2">{preset.category}</td>
                  <td className="px-2 py-2 text-right">
                    <InlinePriceCell id={preset.id} field="value" value={preset.value} inputType="number" />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <InlinePriceCell id={preset.id} field="currency" value={preset.currency} />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <InlinePriceCell id={preset.id} field="unit" value={preset.unit} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
