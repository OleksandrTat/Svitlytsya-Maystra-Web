import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { MessagesInbox } from "@/components/admin/messages/messages-inbox";
import { getDealsWithMessagesForAdmin } from "@/lib/data/queries";

export default async function AdminMessagesPage() {
  const [deals, t] = await Promise.all([
    getDealsWithMessagesForAdmin(),
    getTranslations("admin.crm.messages"),
  ]);

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <MessagesInbox deals={deals} />
    </AdminShell>
  );
}
