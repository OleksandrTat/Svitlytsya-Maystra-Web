import { AdminShell } from "@/components/admin/admin-shell";
import { ContactsList } from "@/components/admin/contacts/contacts-list";
import { getContactsForAdmin } from "@/lib/data/queries";

export default async function AdminContactsPage() {
  const contacts = await getContactsForAdmin();

  return (
    <AdminShell title="Контакти" description="Всі люди, що коли-небудь зверталися.">
      <ContactsList contacts={contacts} />
    </AdminShell>
  );
}
