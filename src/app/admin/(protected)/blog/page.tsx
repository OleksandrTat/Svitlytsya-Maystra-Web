import { AdminShell } from "@/components/admin/admin-shell";
import { BlogAdminClient } from "@/components/admin/blog/blog-admin-client";
import { getAllBlogPostsForAdmin } from "@/lib/data/blog-queries";

export default async function AdminBlogPage() {
  const posts = await getAllBlogPostsForAdmin();

  return (
    <AdminShell
      title="Блог"
      description="Керування статтями: створення, редагування, публікація."
    >
      <BlogAdminClient posts={posts} />
    </AdminShell>
  );
}
