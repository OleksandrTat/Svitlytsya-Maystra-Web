import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  deleteServiceAction,
  upsertServiceAction,
} from "@/actions/admin";
import { getAllServicesForAdmin } from "@/lib/data/queries";

export default async function AdminServicesPage() {
  const services = await getAllServicesForAdmin();

  return (
    <AdminShell
      title="Управління послугами"
      description="Керуйте переліком послуг, описом і порядком відображення."
    >
      <AdminActionForm action={upsertServiceAction} submitLabel="Зберегти послугу">
        <p className="text-xs text-[var(--color-text-secondary)]">Для редагування вкажіть `id` існуючої послуги.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="id" placeholder="id (для редагування)" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="title" placeholder="Назва" required className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="slug" placeholder="slug" required className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="sort_order" type="number" min="0" placeholder="Порядок" required className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="cover_image" type="url" placeholder="Cover image URL" required className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2" />
          <textarea name="short_description" placeholder="Короткий опис" required className="min-h-20 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2" />
          <textarea name="description" placeholder="Повний опис" required className="min-h-24 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2" />
          <textarea name="process_steps" placeholder="Кроки процесу через кому" className="min-h-20 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2" />
        </div>
      </AdminActionForm>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Список послуг</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Назва</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2">Порядок</th>
                <th className="px-2 py-2">Дія</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id} className="border-b border-[var(--color-border)]/60">
                  <td className="px-2 py-2">
                    <p className="font-medium text-[var(--color-text-primary)]">{service.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{service.id}</p>
                  </td>
                  <td className="px-2 py-2">{service.slug}</td>
                  <td className="px-2 py-2">{service.sort_order}</td>
                  <td className="px-2 py-2">
                    <form action={deleteServiceAction as unknown as (formData: FormData) => Promise<void>}>
                      <input type="hidden" name="id" value={service.id} />
                      <button type="submit" className="text-xs text-red-600">Видалити</button>
                    </form>
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
