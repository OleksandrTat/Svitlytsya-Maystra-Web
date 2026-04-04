import { getTranslations } from "next-intl/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { BlogAdminClient } from "@/components/admin/blog/blog-admin-client";
import { getAllBlogPostsForAdmin } from "@/lib/data/blog-queries";

export default async function AdminBlogPage() {
  const [t, posts] = await Promise.all([
    getTranslations("admin.pages.blog"),
    getAllBlogPostsForAdmin(),
  ]);

  return (
    <AdminShell
      title={t("title")}
      description={t("description")}
    >
      <BlogAdminClient posts={posts} />
    </AdminShell>
  );
}
