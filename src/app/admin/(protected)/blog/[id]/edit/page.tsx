import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { BlogPostForm } from "@/components/admin/blog/blog-post-form";
import { getBlogPostByIdForAdmin } from "@/lib/data/blog-queries";
import { getAllServicesForAdmin, getAllProductsForAdmin } from "@/lib/data/queries";

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [post, services, products] = await Promise.all([
    getBlogPostByIdForAdmin(id),
    getAllServicesForAdmin(),
    getAllProductsForAdmin(),
  ]);

  if (!post) {
    redirect("/admin/blog");
  }

  return (
    <AdminShell
      title={`Редагувати: ${post.title}`}
      description="Редагування статті блогу."
    >
      <BlogPostForm
        initialData={post}
        services={services.map((s) => ({ id: s.id, title: s.title }))}
        products={products.map((p) => ({ id: p.id, title: p.title }))}
      />
    </AdminShell>
  );
}
