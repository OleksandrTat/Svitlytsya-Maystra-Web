import { AdminShell } from "@/components/admin/admin-shell";
import { BlogPostForm } from "@/components/admin/blog/blog-post-form";
import { getAllServicesForAdmin, getAllProductsForAdmin } from "@/lib/data/queries";

export default async function AdminBlogNewPage() {
  const [services, products] = await Promise.all([
    getAllServicesForAdmin(),
    getAllProductsForAdmin(),
  ]);

  return (
    <AdminShell title="Нова стаття" description="Створіть нову статтю для блогу.">
      <BlogPostForm
        services={services.map((s) => ({ id: s.id, title: s.title }))}
        products={products.map((p) => ({ id: p.id, title: p.title }))}
      />
    </AdminShell>
  );
}
