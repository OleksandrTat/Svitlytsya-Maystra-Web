import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { getNewsletterSubscribersForAdmin } from "@/lib/data/queries";
import { NewsletterAdminClient } from "@/components/admin/newsletter/newsletter-admin-client";

export default async function AdminNewsletterPage() {
  const [t, subscribers] = await Promise.all([
    getTranslations("admin.pages.newsletter"),
    getNewsletterSubscribersForAdmin(),
  ]);

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <NewsletterAdminClient subscribers={subscribers} />
    </AdminShell>
  );
}
