import { AdminWorkspaceClient } from "@/components/admin/layout/admin-workspace-client";
import { getAdminWorkspaceCounts } from "@/lib/data/queries";

export async function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const counts = await getAdminWorkspaceCounts();

  return (
    <AdminWorkspaceClient title={title} description={description} counts={counts}>
      {children}
    </AdminWorkspaceClient>
  );
}

