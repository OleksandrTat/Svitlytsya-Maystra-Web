import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { upsertSiteSettingAction } from "@/actions/admin";
import { getSiteSettingsForAdmin } from "@/lib/data/queries";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettingsForAdmin();

  return (
    <AdminShell
      title="Налаштування"
      description="Контакти, SEO і соцмережі у форматі JSON або тексту."
    >
      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Поточні налаштування</h2>
        <div className="mt-4 space-y-4">
          {settings.map((setting) => (
            <AdminActionForm key={setting.key} action={upsertSiteSettingAction} submitLabel="Оновити">
              <input type="hidden" name="key" value={setting.key} />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{setting.key}</p>
                <textarea
                  name="value"
                  defaultValue={JSON.stringify(setting.value, null, 2)}
                  className="min-h-28 w-full rounded-xl border border-[var(--color-border)] px-3 py-2 font-mono text-xs"
                />
                <input
                  name="description"
                  defaultValue={setting.description ?? ""}
                  placeholder="Опис"
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                />
              </div>
            </AdminActionForm>
          ))}
        </div>
      </AdminCard>

      <AdminActionForm action={upsertSiteSettingAction} submitLabel="Додати налаштування">
        <div className="grid gap-3 md:grid-cols-2">
          <input name="key" placeholder="Ключ (наприклад, socials)" required className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="description" placeholder="Опис" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <textarea name="value" placeholder='JSON або текстове значення, напр. {"instagram":"https://..."}' required className="min-h-24 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2" />
        </div>
      </AdminActionForm>
    </AdminShell>
  );
}
