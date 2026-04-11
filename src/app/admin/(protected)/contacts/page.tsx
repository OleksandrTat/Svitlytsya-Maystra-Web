import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { ContactsList } from "@/components/admin/contacts/contacts-list";
import { getContactsForAdmin } from "@/lib/data/queries";

export default async function AdminContactsPage() {
  const [contacts, t] = await Promise.all([
    getContactsForAdmin(),
    getTranslations("admin.crm.contacts"),
  ]);

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <ContactsList contacts={contacts} />
    </AdminShell>
  );
}
