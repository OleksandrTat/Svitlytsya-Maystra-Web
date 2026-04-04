import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAllFaqItemsForAdmin, getFaqCategoryLabels } from "@/lib/data/faq-queries";
import { FaqAdminClient } from "@/components/admin/faq/faq-admin-client";

export default async function AdminFaqPage() {
  const [t, items, customLabels] = await Promise.all([
    getTranslations("admin.pages.faq"),
    getAllFaqItemsForAdmin(),
    getFaqCategoryLabels(),
  ]);

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <FaqAdminClient items={items} customLabels={customLabels} />
    </AdminShell>
  );
}
