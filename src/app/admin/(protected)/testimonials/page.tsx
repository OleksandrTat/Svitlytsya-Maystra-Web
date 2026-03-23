import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDeleteButton } from "@/components/admin/shared/confirm-delete-button";
import { deleteTestimonialAction, upsertTestimonialAction } from "@/actions/admin";
import { getAllProductsForAdmin, getAllTestimonialsForAdmin } from "@/lib/data/queries";

export default async function AdminTestimonialsPage() {
  const [testimonials, products] = await Promise.all([
    getAllTestimonialsForAdmin(),
    getAllProductsForAdmin(),
  ]);
  const productMap = new Map(products.map((product) => [product.id, product]));

  return (
    <AdminShell
      title="Керування відгуками"
      description="Додавайте, редагуйте та приховуйте відгуки клієнтів на сайті."
    >
      <AdminActionForm action={upsertTestimonialAction} submitLabel="Зберегти відгук">
        <p className="text-xs text-[var(--color-text-secondary)]">
          Для редагування вкажіть `id` відгуку.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="id"
            placeholder="id (для редагування)"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            name="author_name"
            placeholder="Ім’я автора"
            required
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            name="author_location"
            placeholder="Місто"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            name="rating"
            type="number"
            min="1"
            max="5"
            placeholder="Рейтинг"
            required
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <select
            name="product_id"
            defaultValue=""
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          >
            <option value="">Без прив’язки до продукту</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>
          <textarea
            name="content"
            placeholder="Текст відгуку"
            required
            className="min-h-24 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          />
          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] md:col-span-2">
            <input type="checkbox" name="is_visible" defaultChecked />
            Показувати на сайті
          </label>
        </div>
      </AdminActionForm>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Список відгуків
        </h2>
        <div className="mt-4 space-y-3">
          {testimonials.map((item) => {
            const linkedProduct = item.project_id ? productMap.get(item.project_id) : null;

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {item.author_name}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {item.author_location ?? "Локація не вказана"}
                    </p>
                    {linkedProduct ? (
                      <p className="mt-1 text-xs text-[var(--color-primary)]">
                        Прив’язано до: {linkedProduct.title}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="rounded-full bg-white px-2 py-1">
                      Рейтинг: {item.rating}/5
                    </span>
                    <span className="rounded-full bg-white px-2 py-1">
                      {item.is_visible ? "Видимий" : "Прихований"}
                    </span>
                    <form action={deleteTestimonialAction as unknown as (formData: FormData) => Promise<void>}>
                      <input type="hidden" name="id" value={item.id} />
                      <ConfirmDeleteButton
                        confirmMessage="Delete testimonial?"
                        className="text-sm"
                      />
                    </form>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{item.content}</p>
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">ID: {item.id}</p>
              </article>
            );
          })}
        </div>
      </AdminCard>
    </AdminShell>
  );
}
