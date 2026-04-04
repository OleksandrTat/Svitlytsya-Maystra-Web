import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { InquiriesBoard } from "@/components/admin/inquiries/inquiries-board";
import { getAllInquiriesForAdmin } from "@/lib/data/queries";

export default async function AdminInquiriesPage() {
  const [t, inquiries] = await Promise.all([
    getTranslations("admin.pages.inquiries"),
    getAllInquiriesForAdmin(),
  ]);

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <InquiriesBoard inquiries={inquiries} />
    </AdminShell>
  );
}
