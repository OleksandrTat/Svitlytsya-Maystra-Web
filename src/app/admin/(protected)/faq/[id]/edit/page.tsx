import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { FaqForm } from "@/components/admin/faq/faq-form";
import {
  getAllFaqItemsForAdmin,
  getFaqCategoryLabels,
  getFaqItemByIdForAdmin,
} from "@/lib/data/faq-queries";

export default async function AdminFaqEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [item, items, customLabels] = await Promise.all([
    getFaqItemByIdForAdmin(id),
    getAllFaqItemsForAdmin(),
    getFaqCategoryLabels(),
  ]);

  if (!item) {
    redirect("/admin/faq");
  }

  const allCategories = [...new Set(items.map((i) => i.category))];

  return (
    <AdminShell title={`Редагувати: ${item.question.slice(0, 60)}…`} description="Редагування FAQ питання.">
      <FaqForm
        initialData={item}
        allCategories={allCategories}
        totalItems={items.length}
        customLabels={customLabels}
      />
    </AdminShell>
  );
}
