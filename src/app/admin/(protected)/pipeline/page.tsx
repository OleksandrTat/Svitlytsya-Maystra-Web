import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { PipelineBoard } from "@/components/admin/pipeline/pipeline-board";
import { getDealsForAdmin } from "@/lib/data/queries";

export default async function AdminPipelinePage() {
  const [deals, t] = await Promise.all([
    getDealsForAdmin(),
    getTranslations("admin.crm.pipeline"),
  ]);

  return (
    <AdminShell title={t("title")} description={t("description")}>
      <div className="overflow-hidden">
        <PipelineBoard deals={deals} />
      </div>
    </AdminShell>
  );
}
