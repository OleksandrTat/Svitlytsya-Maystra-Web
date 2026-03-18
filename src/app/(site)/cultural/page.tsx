import type { Metadata } from "next";
import { BlogCardWithPath } from "@/components/blog/blog-card";
import { BlogPagination } from "@/components/blog/blog-pagination";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Культурний блог",
  description: "Есе та історії про ремесло, дерево і архітектуру.",
};

export const revalidate = 300;

const PAGE_SIZE = 9;

export default async function CulturalBlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;

  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());

  const { data, count } = supabase
    ? await supabase
        .from("cultural_blog_posts")
        .select(
          "id,title,slug,excerpt,cover_image,category,reading_time_min,published_at",
          { count: "exact" },
        )
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    : { data: [], count: 0 };

  const posts = data ?? [];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <section className="py-16">
      <Container>
        <div
          className="relative overflow-hidden rounded-3xl py-16 text-center"
          style={{ background: "linear-gradient(135deg, #2d4a3e, #1f3429)" }}
        >
          <div className="relative z-10">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: "#c8ddd5" }}
            >
              Окремий розділ
            </p>
            <h1 className="mt-2 font-display text-4xl text-white md:text-5xl">Культурний блог</h1>
            <p
              className="mx-auto mt-4 max-w-xl text-sm"
              style={{ color: "rgb(200 221 213 / 0.85)" }}
            >
              Есе та розповіді про традиції столярства, архітектурний контекст і культуру
              матеріалу — від авторів і майстрів.
            </p>
          </div>
        </div>

        {posts.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-secondary)]">
            Поки немає опублікованих матеріалів.
          </p>
        ) : (
          <>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <BlogCardWithPath key={post.id} post={post} basePath="/cultural" />
              ))}
            </div>
            <BlogPagination currentPage={page} totalPages={totalPages} basePath="/cultural" />
          </>
        )}
      </Container>
    </section>
  );
}
