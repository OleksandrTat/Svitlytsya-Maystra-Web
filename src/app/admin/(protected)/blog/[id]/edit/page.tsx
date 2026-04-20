import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { BlogPostForm } from "@/components/admin/blog/blog-post-form";
import { getBlogPostByIdForAdmin } from "@/lib/data/blog-queries";
import { getAllServicesForAdmin, getAllProductsForAdmin } from "@/lib/data/queries";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  let allCategories: string[] = [];

  let categoryLabels: Record<string, { uk?: string; en?: string }> = {};
  let allTags: string[] = [];
  let tagTranslations: Record<string, string> = {};
  const [post, services, products] = await Promise.all([
    getBlogPostByIdForAdmin(id),
    getAllServicesForAdmin(),
    getAllProductsForAdmin(),
    (async () => {
      if (!supabase) return;
      const [catsRes, tagsRes, catLabelsRes] = await Promise.all([
        supabase.from("blog_posts").select("category").not("category", "is", null),
        supabase.from("blog_posts").select("tags").not("tags", "is", null),
        supabase.from("blog_categories").select("slug, label_uk, label_en").eq("is_active", true),
      ]);
      allCategories = [...new Set((catsRes.data ?? []).map(r => r.category).filter(Boolean))];
      allTags = [...new Set((tagsRes.data ?? []).flatMap(r => Array.isArray(r.tags) ? r.tags as string[] : []))];
      categoryLabels = Object.fromEntries(
        (catLabelsRes.data ?? []).map((r) => [r.slug, { uk: r.label_uk, en: r.label_en ?? undefined }]),
      );
      // tag translations now come from a dedicated tags lookup (future);
      // the legacy site_settings["blog_tag_translations"] key has been dropped.
      tagTranslations = {};
    })(),
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
        allCategories={allCategories}
        categoryLabels={categoryLabels}
        allTags={allTags}
        tagTranslations={tagTranslations}
      />
    </AdminShell>
  );
}
