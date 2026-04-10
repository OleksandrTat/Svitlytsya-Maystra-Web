import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { DealDetailClient } from "@/components/admin/pipeline/deal-detail-client";
import {
  getDealByIdForAdmin,
  getDealMessagesForAdmin,
  getDealStageHistoryForAdmin,
} from "@/lib/data/queries";

export default async function AdminDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [deal, messages, history] = await Promise.all([
    getDealByIdForAdmin(id),
    getDealMessagesForAdmin(id),
    getDealStageHistoryForAdmin(id),
  ]);

  if (!deal) redirect("/admin/pipeline");

  return (
    <AdminShell title="" bare>
      <DealDetailClient deal={deal} messages={messages} history={history} />
    </AdminShell>
  );
}
