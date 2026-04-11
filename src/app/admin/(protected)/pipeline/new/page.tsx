import { AdminShell } from "@/components/admin/admin-shell";
import { NewDealForm } from "@/components/admin/pipeline/new-deal-form";
import { getContactsForAdmin } from "@/lib/data/queries";

export default async function NewDealPage() {
  const contacts = await getContactsForAdmin();

  return (
    <AdminShell title="" bare>
      <NewDealForm contacts={contacts} />
    </AdminShell>
  );
}
