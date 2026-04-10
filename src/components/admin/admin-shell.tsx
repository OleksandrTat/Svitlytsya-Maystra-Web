import { AdminWorkspaceClient } from "@/components/admin/layout/admin-workspace-client";
import { getAdminWorkspaceCounts } from "@/lib/data/queries";

export async function AdminShell({
  title,
  description,
  children,
  bare = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  bare?: boolean;
}) {
  const counts = await getAdminWorkspaceCounts();

  return (
    <AdminWorkspaceClient title={title} description={description} counts={counts} bare={bare}>
      {children}
    </AdminWorkspaceClient>
  );
}

