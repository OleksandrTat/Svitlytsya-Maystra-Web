import { AdminShell } from "@/components/admin/admin-shell";
import { BlogPostForm } from "@/components/admin/blog/blog-post-form";
import { getAllServicesForAdmin, getAllProductsForAdmin } from "@/lib/data/queries";
import { getBlogCategoryLabels } from "@/lib/data/categories";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export default async function AdminBlogNewPage() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  let allCategories: string[] = [];
  let allTags: string[] = [];
  let tagTranslations: Record<string, string> = {};

  const [services, products, categoryLabels] = await Promise.all([
    getAllServicesForAdmin(),
    getAllProductsForAdmin(),
    getBlogCategoryLabels(),
    (async () => {
      if (!supabase) return;
      const [catsRes, tagsRes, settingsRes] = await Promise.all([
        supabase.from("blog_posts").select("category").not("category", "is", null),
        supabase.from("blog_posts").select("tags").not("tags", "is", null),
        supabase.from("site_settings").select("key, value").eq("key", "blog_tag_translations").maybeSingle(),
      ]);
      allCategories = [...new Set((catsRes.data ?? []).map(r => r.category).filter(Boolean))];
      allTags = [...new Set((tagsRes.data ?? []).flatMap(r => Array.isArray(r.tags) ? r.tags as string[] : []))];
      tagTranslations = (settingsRes.data?.value ?? {}) as Record<string, string>;
    })(),
  ]);

  for (const slug of Object.keys(categoryLabels)) {
    if (!allCategories.includes(slug)) allCategories.push(slug);
  }

  return (
    <AdminShell title="Нова стаття" description="Створіть нову статтю для блогу.">
      <BlogPostForm
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
