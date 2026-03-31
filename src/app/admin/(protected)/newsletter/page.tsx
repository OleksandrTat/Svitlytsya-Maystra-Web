import { AdminShell } from "@/components/admin/admin-shell";
import { getNewsletterSubscribersForAdmin } from "@/lib/data/queries";
import { NewsletterAdminClient } from "@/components/admin/newsletter/newsletter-admin-client";

export default async function AdminNewsletterPage() {
  const subscribers = await getNewsletterSubscribersForAdmin();

  return (
    <AdminShell
      title="Розсилка"
      description="Керування підписниками на розсилку."
    >
      <NewsletterAdminClient subscribers={subscribers} />
    </AdminShell>
  );
}
