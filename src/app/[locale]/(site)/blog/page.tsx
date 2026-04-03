import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogFeaturedHero } from "@/components/blog/blog-featured-hero";
import { BlogFiltersBar } from "@/components/blog/blog-filters-bar";
import { BlogPagination } from "@/components/blog/blog-pagination";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import {
  getPublishedBlogPosts,
  getFeaturedBlogPosts,
  getBlogCategories,
  getAllBlogTags,
} from "@/lib/data/blog-queries";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("blogPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const category = params.category;
  const tag = params.tag;
  const pageSize = 9;

  const [{ items: rawItems, total }, rawFeatured, categories, tags, locale, t] = await Promise.all([
    getPublishedBlogPosts({ page, pageSize, category, tag }),
    !category && !tag && page === 1 ? getFeaturedBlogPosts(1) : Promise.resolve([]),
    getBlogCategories(),
    getAllBlogTags(),
    getLocale(),
    getTranslations("blogPage"),
  ]);
  const { localizeBlogPost } = await import("@/lib/i18n/content");
  const items = rawItems.map((p) => localizeBlogPost(p, locale as "uk" | "en"));
  const featured = rawFeatured.map((p) => localizeBlogPost(p, locale as "uk" | "en"));

  const totalPages = Math.ceil(total / pageSize);
  const featuredPost = featured[0] ?? null;
  const regularPosts = featuredPost ? items.filter((p) => p.id !== featuredPost.id) : items;

  return (
    <>
      <PageHero
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        imageUrl="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1920&q=80"
      />

      <section className="py-14 md:py-20">
        <Container>
          {featuredPost && <BlogFeaturedHero post={featuredPost} />}

          <Suspense fallback={null}>
            <BlogFiltersBar
              categories={categories}
              tags={tags}
              activeCategory={category}
              activeTag={tag}
            />
          </Suspense>

          {regularPosts.length > 0 ? (
            <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {regularPosts.map((post, i) => (
                <BlogCard key={post.id} post={post} index={i} />
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center gap-4 text-center">
              <p className="font-display text-2xl text-[var(--color-text-primary)]">
                {t("noArticles")}
              </p>
              <p className="text-[var(--color-text-muted)]">
                {t("noArticlesHint")}
              </p>
            </div>
          )}

          <div className="my-12">
            <NewsletterForm variant="card" />
          </div>

          {totalPages > 1 && (
            <BlogPagination
              currentPage={page}
              totalPages={totalPages}
              category={category}
              tag={tag}
            />
          )}
        </Container>
      </section>
    </>
  );
}
