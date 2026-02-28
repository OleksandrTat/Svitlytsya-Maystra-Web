import type { Metadata } from "next";
import { BlogCardWithPath } from "@/components/blog/blog-card";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Культурний блог",
  description: "Есе та історії про ремесло, дерево і архітектуру.",
};

export const revalidate = 300;

export default async function CulturalBlogPage() {
  const supabase = await createSupabaseServerClient();

  const { data: posts } = supabase
    ? await supabase
        .from("cultural_blog_posts")
        .select(
          "id,title,slug,excerpt,cover_image,category,reading_time_min,published_at",
        )
        .eq("is_published", true)
        .order("published_at", { ascending: false })
    : { data: [] };

  return (
    <section className="py-16">
      <Container>
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">Культурний блог</h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--color-text-secondary)]">
          Розповіді про традиції столярства, архітектурний контекст і культуру матеріалу.
        </p>

        {(posts ?? []).length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-secondary)]">
            Поки немає опублікованих матеріалів.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {(posts ?? []).map((post) => (
              <BlogCardWithPath key={post.id} post={post} basePath="/cultural" />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
