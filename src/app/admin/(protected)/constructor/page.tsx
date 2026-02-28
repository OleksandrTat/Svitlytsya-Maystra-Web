import { uploadConfigurationPhotoAction } from "@/actions/admin/constructor";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatInquiryDate } from "@/lib/utils";

export default async function AdminConstructorPage() {
  const supabase = await createSupabaseServerClient();
  const { data: rows } = supabase
    ? await supabase
        .from("product_configurations")
        .select("id,product_type,configuration_key,image_url,is_active,updated_at")
        .order("updated_at", { ascending: false })
    : { data: [] };

  const uploadPhoto = async (formData: FormData) => {
    "use server";
    await uploadConfigurationPhotoAction(formData);
  };

  return (
    <AdminShell
      title="Конструктор"
      description="Матриця фото-комбінацій для дверей та меблів."
    >
      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Завантажити фото комбінації</h2>
        <form action={uploadPhoto} className="mt-4 grid gap-3 md:grid-cols-2">
          <select
            name="product_type"
            defaultValue="door"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            <option value="door">door</option>
            <option value="furniture">furniture</option>
            <option value="window">window</option>
          </select>
          <input
            name="configuration_key"
            placeholder="interior_oak_natural_no-glass_modern_200x80"
            required
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            required
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          />
          <button
            type="submit"
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white md:col-span-2"
          >
            Завантажити
          </button>
        </form>
      </AdminCard>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Наявні конфігурації</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Product</th>
                <th className="px-2 py-2">Configuration key</th>
                <th className="px-2 py-2">Active</th>
                <th className="px-2 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((row) => (
                <tr key={row.id} className="border-b border-[var(--color-border)]/60">
                  <td className="px-2 py-3">{row.product_type}</td>
                  <td className="px-2 py-3 break-all">
                    <a href={row.image_url} target="_blank" rel="noreferrer" className="underline">
                      {row.configuration_key}
                    </a>
                  </td>
                  <td className="px-2 py-3">{row.is_active ? "yes" : "no"}</td>
                  <td className="px-2 py-3">{formatInquiryDate(row.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
