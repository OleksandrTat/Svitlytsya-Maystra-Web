import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  deleteProjectAction,
  upsertProjectAction,
} from "@/actions/admin";
import { PROJECT_CATEGORY_LABELS, PROJECT_STATUS_LABELS } from "@/lib/constants";
import { getAllProjectsForAdmin } from "@/lib/data/queries";

export default async function AdminProjectsPage() {
  const projects = await getAllProjectsForAdmin();

  return (
    <AdminShell
      title="Управління проєктами"
      description="Додавайте нові проєкти або редагуйте існуючі за їхнім ID."
    >
      <AdminActionForm action={upsertProjectAction} submitLabel="Зберегти проєкт">
        <p className="text-xs text-[var(--color-text-secondary)]">Щоб оновити існуючий проєкт, вкажіть його `id`.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="id" placeholder="id (для редагування)" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="title" placeholder="Назва" required className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="slug" placeholder="slug" required className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <select name="category" required className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm">
            {Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input name="cover_image" type="url" placeholder="Cover image URL" required className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2" />
          <textarea name="description" placeholder="Опис" required className="min-h-24 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2" />
          <input name="style" placeholder="Стилі через кому" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="materials" placeholder="Матеріали через кому" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="dimensions" placeholder="Розміри" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="location" placeholder="Локація" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="completed_at" type="date" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="duration_days" type="number" min="1" max="365" placeholder="Термін (днів)" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <select name="status" required className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm">
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input name="images" placeholder="Список image URL через кому" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2" />
          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] md:col-span-2">
            <input type="checkbox" name="is_featured" />
            Показувати на головній
          </label>
        </div>
      </AdminActionForm>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Список проєктів</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Назва</th>
                <th className="px-2 py-2">Категорія</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Featured</th>
                <th className="px-2 py-2">Дія</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-[var(--color-border)]/60">
                  <td className="px-2 py-2">
                    <p className="font-medium text-[var(--color-text-primary)]">{project.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{project.id}</p>
                  </td>
                  <td className="px-2 py-2">{PROJECT_CATEGORY_LABELS[project.category]}</td>
                  <td className="px-2 py-2">{PROJECT_STATUS_LABELS[project.status]}</td>
                  <td className="px-2 py-2">{project.is_featured ? "Так" : "Ні"}</td>
                  <td className="px-2 py-2">
                    <form action={deleteProjectAction as unknown as (formData: FormData) => Promise<void>}>
                      <input type="hidden" name="id" value={project.id} />
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
