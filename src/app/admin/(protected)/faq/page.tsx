import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAllFaqItemsForAdmin, getFaqCategoryLabels, getFaqCategoryOrder } from "@/lib/data/faq-queries";
import { FaqAdminClient } from "@/components/admin/faq/faq-admin-client";

export default async function AdminFaqPage() {
  const [t, items, customLabels, savedCategoryOrder] = await Promise.all([
    getTranslations("admin.pages.faq"),
    getAllFaqItemsForAdmin(),
    getFaqCategoryLabels(),
    getFaqCategoryOrder(),
  ]);

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <FaqAdminClient items={items} customLabels={customLabels} savedCategoryOrder={savedCategoryOrder} />
    </AdminShell>
  );
}
