import { AdminShell } from "@/components/admin/admin-shell";
import { InquiriesBoard } from "@/components/admin/inquiries/inquiries-board";
import { getAllInquiriesForAdmin } from "@/lib/data/queries";

export default async function AdminInquiriesPage() {
  const inquiries = await getAllInquiriesForAdmin();

  return (
    <AdminShell
      title="Заявки"
      description="Pipeline заявок: від нових звернень до виграних, виконаних та архівних."
    >
      <InquiriesBoard inquiries={inquiries} />
    </AdminShell>
  );
}
