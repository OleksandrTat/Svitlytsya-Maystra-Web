import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDeleteButton } from "@/components/admin/shared/confirm-delete-button";
import {
  deleteTestimonialAction,
  upsertTestimonialAction,
} from "@/actions/admin";
import { getAllTestimonialsForAdmin } from "@/lib/data/queries";

export default async function AdminTestimonialsPage() {
  const testimonials = await getAllTestimonialsForAdmin();

  return (
    <AdminShell
      title="РЈРїСЂР°РІР»С–РЅРЅСЏ РІС–РґРіСѓРєР°РјРё"
      description="Р”РѕРґР°РІР°Р№С‚Рµ, СЂРµРґР°РіСѓР№С‚Рµ С‚Р° РєРµСЂСѓР№С‚Рµ РІРёРґРёРјС–СЃС‚СЋ РІС–РґРіСѓРєС–РІ РЅР° СЃР°Р№С‚С–."
    >
      <AdminActionForm action={upsertTestimonialAction} submitLabel="Р—Р±РµСЂРµРіС‚Рё РІС–РґРіСѓРє">
        <p className="text-xs text-[var(--color-text-secondary)]">Р”Р»СЏ СЂРµРґР°РіСѓРІР°РЅРЅСЏ РІРєР°Р¶С–С‚СЊ `id` РІС–РґРіСѓРєСѓ.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="id" placeholder="id (РґР»СЏ СЂРµРґР°РіСѓРІР°РЅРЅСЏ)" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="author_name" placeholder="С–РјвЂ™СЏ Р°РІС‚РѕСЂР°" required className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="author_location" placeholder="РњС–СЃС‚Рѕ" className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="rating" type="number" min="1" max="5" placeholder="Р РµР№С‚РёРЅРі" required className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm" />
          <textarea name="content" placeholder="РўРµРєСЃС‚ РІС–РґРіСѓРєСѓ" required className="min-h-24 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2" />
          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] md:col-span-2">
            <input type="checkbox" name="is_visible" defaultChecked />
            РџРѕРєР°Р·СѓРІР°С‚Рё РЅР° СЃР°Р№С‚С–
          </label>
        </div>
      </AdminActionForm>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">РЎРїРёСЃРѕРє РІС–РґРіСѓРєС–РІ</h2>
        <div className="mt-4 space-y-3">
          {testimonials.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{item.author_name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{item.author_location ?? "Р›РѕРєР°С†С–СЏ РЅРµ РІРєР°Р·Р°РЅР°"}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-full bg-white px-2 py-1">Р РµР№С‚РёРЅРі: {item.rating}/5</span>
                  <span className="rounded-full bg-white px-2 py-1">{item.is_visible ? "Р’РёРґРёРјРёР№" : "РџСЂРёС…РѕРІР°РЅРёР№"}</span>
                  <form action={deleteTestimonialAction as unknown as (formData: FormData) => Promise<void>}>
                    <input type="hidden" name="id" value={item.id} />
                    <ConfirmDeleteButton confirmMessage="Delete testimonial?" className="text-sm" />
                  </form>
                </div>
              </div>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{item.content}</p>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">ID: {item.id}</p>
            </article>
          ))}
        </div>
      </AdminCard>
    </AdminShell>
  );
}
