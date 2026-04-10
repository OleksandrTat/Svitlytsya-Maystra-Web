import { AdminShell } from "@/components/admin/admin-shell";
import { MessagesInbox } from "@/components/admin/messages/messages-inbox";
import { getDealsWithMessagesForAdmin } from "@/lib/data/queries";

export default async function AdminMessagesPage() {
  const deals = await getDealsWithMessagesForAdmin();

  return (
    <AdminShell title="Повідомлення" description="Вся переписка по угодах.">
      <MessagesInbox deals={deals} />
    </AdminShell>
  );
}
