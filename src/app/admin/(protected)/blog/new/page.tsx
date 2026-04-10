import { AdminShell } from "@/components/admin/admin-shell";
import { BlogPostForm } from "@/components/admin/blog/blog-post-form";
import { getAllServicesForAdmin, getAllProductsForAdmin } from "@/lib/data/queries";
import {
  createSupabaseServiceClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export default async function AdminBlogNewPage() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  let allCategories: string[] = [];
  let categoryLabels: Record<string, { uk?: string; en?: string }> = {};
  let allTags: string[] = [];
  let tagTranslations: Record<string, string> = {};

  const [services, products] = await Promise.all([
    getAllServicesForAdmin(),
    getAllProductsForAdmin(),
    (async () => {
      if (!supabase) return;
      const [catsRes, tagsRes, settingsRes] = await Promise.all([
        supabase.from("blog_posts").select("category").not("category", "is", null),
        supabase.from("blog_posts").select("tags").not("tags", "is", null),
        supabase.from("site_settings").select("key, value").in("key", ["blog_category_labels", "blog_tag_translations"]),
      ]);
      allCategories = [...new Set((catsRes.data ?? []).map(r => r.category).filter(Boolean))];
      allTags = [...new Set((tagsRes.data ?? []).flatMap(r => Array.isArray(r.tags) ? r.tags as string[] : []))];
      const settingsMap = Object.fromEntries((settingsRes.data ?? []).map(r => [r.key, r.value]));
      categoryLabels = (settingsMap["blog_category_labels"] ?? {}) as Record<string, { uk?: string; en?: string }>;
      tagTranslations = (settingsMap["blog_tag_translations"] ?? {}) as Record<string, string>;
    })(),
  ]);

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
