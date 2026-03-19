import { BlogAdminClient } from "@/components/admin/blog/blog-admin-client";
import { AdminShell } from "@/components/admin/admin-shell";
import { getBlogPostsForAdmin } from "@/lib/data/queries";

export default async function AdminBlogPage() {
  const posts = await getBlogPostsForAdmin();

  return (
    <AdminShell
      title="Блог компанії"
      description="Управління статтями, featured картками, SEO та публікацією в одному вікні."
    >
      <BlogAdminClient posts={posts} />
    </AdminShell>
  );
}
