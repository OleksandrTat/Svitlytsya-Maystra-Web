import { AdminShell } from "@/components/admin/admin-shell";
import { getAllFaqItemsForAdmin } from "@/lib/data/faq-queries";
import { FaqAdminClient } from "@/components/admin/faq/faq-admin-client";

export default async function AdminFaqPage() {
  const items = await getAllFaqItemsForAdmin();

  return (
    <AdminShell
      title="FAQ"
      description="Керування поширеними запитаннями."
    >
      <FaqAdminClient items={items} />
    </AdminShell>
  );
}
