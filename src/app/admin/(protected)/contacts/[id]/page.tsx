import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContactCardClient } from "@/components/admin/contacts/contact-card-client";
import { getContactByIdForAdmin, getContactDealsForAdmin } from "@/lib/data/queries";

export default async function AdminContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [contact, deals] = await Promise.all([
    getContactByIdForAdmin(id),
    getContactDealsForAdmin(id),
  ]);

  if (!contact) redirect("/admin/contacts");

  return (
    <AdminShell title="">
      <ContactCardClient contact={contact} deals={deals} />
    </AdminShell>
  );
}
