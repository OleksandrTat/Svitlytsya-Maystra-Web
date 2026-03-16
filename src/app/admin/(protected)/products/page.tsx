import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminCard } from "@/components/admin/admin-card";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmDeleteButton } from "@/components/admin/shared/confirm-delete-button";
import {
  deleteProductAction,
  upsertProductAction,
  updateProductSortOrderAction,
} from "@/actions/admin/products";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { getAllProductsForAdmin, getPriceFormulasForAdmin } from "@/lib/data/queries";

export default async function AdminProductsPage() {
  const [products, formulas] = await Promise.all([
    getAllProductsForAdmin(),
    getPriceFormulasForAdmin(),
  ]);

  const updateSortOrder = async (formData: FormData) => {
    "use server";
    const id = String(formData.get("id") || "");
    const sortOrder = Number(formData.get("sort_order") || 0);
    if (!id) {
      return;
    }
    await updateProductSortOrderAction([{ id, sort_order: sortOrder }]);
  };

  return (
    <AdminShell
      title="Управління продуктами"
      description="Додавайте та редагуйте продукти, керуйте цінами, формулами та порядком відображення."
    >
      <AdminActionForm action={upsertProductAction} submitLabel="Зберегти продукт">
        <p className="text-xs text-[var(--color-text-secondary)]">
          Щоб оновити існуючий продукт, вкажіть його `id`.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            name="id"
            placeholder="id (для редагування)"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            name="title"
            placeholder="Назва"
            required
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            name="slug"
            placeholder="slug"
            required
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <select
            name="category"
            required
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <textarea
            name="description"
            placeholder="Опис"
            required
            className="min-h-24 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            name="short_description"
            placeholder="Короткий опис"
            className="min-h-20 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          />
          <input
            name="materials"
            placeholder="Матеріали через кому"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            name="style"
            placeholder="Стилі через кому"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <input
            name="cover_image"
            type="url"
            placeholder="Cover image URL"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          />
          <input
            name="images"
            placeholder="Список image URL через кому"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          />
          <input
            name="price_from"
            type="number"
            min="0"
            step="0.01"
            placeholder="Ціна від"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <select
            name="formula_id"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            <option value="">Без формули</option>
            {formulas.map((formula) => (
              <option key={formula.id} value={formula.id}>
                {formula.name}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue="draft"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            name="sort_order"
            type="number"
            min="0"
            placeholder="Порядок"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          />
          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] md:col-span-2">
            <input type="checkbox" name="is_featured" />
            Показувати у рекомендаціях
          </label>
          <input
            name="seo_title"
            placeholder="SEO title"
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            name="seo_description"
            placeholder="SEO description"
            className="min-h-20 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm md:col-span-2"
          />
        </div>
      </AdminActionForm>

      <AdminCard>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Список продуктів</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                <th className="px-2 py-2">Назва</th>
                <th className="px-2 py-2">Категорія</th>
                <th className="px-2 py-2">Ціна від</th>
                <th className="px-2 py-2">Статус</th>
                <th className="px-2 py-2">Порядок</th>
                <th className="px-2 py-2">Featured</th>
                <th className="px-2 py-2">Дії</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-[var(--color-border)]/60">
                  <td className="px-2 py-2">
                    <p className="font-medium text-[var(--color-text-primary)]">{product.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{product.id}</p>
                  </td>
                  <td className="px-2 py-2">
                    {PRODUCT_CATEGORY_LABELS[
                      product.category as keyof typeof PRODUCT_CATEGORY_LABELS
                    ] ?? product.category}
                  </td>
                  <td className="px-2 py-2">
                    {product.price_from
                      ? `${product.price_from.toLocaleString("uk-UA")} грн`
                      : "-"}
                  </td>
                  <td className="px-2 py-2">
                    {PRODUCT_STATUS_LABELS[product.status] ?? product.status}
                  </td>
                  <td className="px-2 py-2">
                    <form action={updateSortOrder} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={product.id} />
                      <input
                        name="sort_order"
                        type="number"
                        min="0"
                        defaultValue={product.sort_order}
                        className="w-20 rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs"
                      />
                      <button type="submit" className="text-xs text-[var(--color-primary)]">
                        Оновити
                      </button>
                    </form>
                  </td>
                  <td className="px-2 py-2">{product.is_featured ? "Так" : "Ні"}</td>
                  <td className="px-2 py-2">
                    <form
                      action={
                        deleteProductAction as unknown as (formData: FormData) => Promise<void>
                      }
                    >
                      <input type="hidden" name="id" value={product.id} />
                      <ConfirmDeleteButton confirmMessage="Delete product?" />
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
