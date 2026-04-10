import { AdminShell } from "@/components/admin/admin-shell";
import { FaqForm } from "@/components/admin/faq/faq-form";
import { getAllFaqItemsForAdmin, getFaqCategoryLabels } from "@/lib/data/faq-queries";

export default async function AdminFaqNewPage() {
  const [items, customLabels] = await Promise.all([
    getAllFaqItemsForAdmin(),
    getFaqCategoryLabels(),
  ]);

  const allCategories = [...new Set(items.map((i) => i.category))];

  return (
    <AdminShell title="Нове питання" description="Додайте питання до бази FAQ.">
      <FaqForm
        allCategories={allCategories}
        totalItems={items.length}
        customLabels={customLabels}
      />
    </AdminShell>
  );
}
