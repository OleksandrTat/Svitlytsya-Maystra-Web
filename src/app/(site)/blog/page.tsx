import type { Metadata } from "next";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogFilters } from "@/components/blog/blog-filters";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Блог компанії",
  description: "Практичні статті про матеріали, догляд та процес виготовлення.",
};

export const revalidate = 300;

type SearchParams = Record<string, string | string[] | undefined>;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const activeCategory = typeof params.category === "string" ? params.category : undefined;

  const supabase = await createSupabaseServerClient();

  let posts: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    cover_image: string | null;
    category: string;
    reading_time_min: number;
    published_at: string | null;
  }[] = [];

  if (supabase) {
    let query = supabase
      .from("blog_posts")
      .select(
        "id,title,slug,excerpt,cover_image,category,reading_time_min,published_at",
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (activeCategory) {
      query = query.eq("category", activeCategory);
    }

    const { data } = await query;
    posts = data ?? [];
  }

  const categories = Array.from(new Set(posts.map((post) => post.category))).sort((a, b) =>
    a.localeCompare(b, "uk"),
  );

  return (
    <section className="py-16">
      <Container>
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">Блог</h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--color-text-secondary)]">
          Матеріали про дерево, технології обробки та практичні поради з догляду.
        </p>

        <div className="mt-6">
          <BlogFilters categories={categories} activeCategory={activeCategory} />
        </div>

        {posts.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-secondary)]">
            Поки немає опублікованих статей.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
