import { AdminShell } from "@/components/admin/admin-shell";
import { PipelineBoard } from "@/components/admin/pipeline/pipeline-board";
import { getDealsForAdmin } from "@/lib/data/queries";

export default async function AdminPipelinePage() {
  const deals = await getDealsForAdmin();

  return (
    <AdminShell title="Pipeline" description="Усі угоди від першого контакту до завершення.">
      <div className="overflow-hidden">
        <PipelineBoard deals={deals} />
      </div>
    </AdminShell>
  );
}
