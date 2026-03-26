import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { BlogCard } from "@/components/blog/blog-card";
import { BlogPostViews } from "@/components/blog/blog-post-views";
import { BlogPostLike } from "@/components/blog/blog-post-like";
import { BlogTableOfContents } from "@/components/blog/blog-toc";
import { BlogShareButtons } from "@/components/blog/blog-share-buttons";
import {
  getBlogPostBySlug,
  getRelatedBlogPosts,
  incrementBlogPostViews,
} from "@/lib/data/blog-queries";
import { BLOG_CATEGORY_LABELS } from "@/lib/constants";
import { formatInquiryDate } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Статтю не знайдено" };

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      images: post.cover_image ? [{ url: post.cover_image }] : [],
      type: "article",
      publishedTime: post.published_at ?? undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedBlogPosts(post.slug, post.category, post.tags);

  // Fire and forget
  void incrementBlogPostViews(slug);

  const categoryLabel = BLOG_CATEGORY_LABELS[post.category] ?? post.category;

  return (
    <article>
      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative min-h-[60vh] overflow-hidden">
        {post.cover_image ? (
          <>
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A0A] via-[#1A0A0A]/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[var(--color-primary)]" />
        )}

        <div className="absolute inset-x-0 bottom-0 p-8 md:p-14">
          <Container>
            <Breadcrumbs
              className="mb-6 [&_a]:text-white/60 [&_span]:text-white/40"
              items={[
                { label: "Головна", href: "/" },
                { label: "Блог", href: "/blog" },
                { label: categoryLabel, href: `/blog?category=${post.category}` },
                { label: post.title },
              ]}
            />

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--color-accent)]/90 px-3 py-1 text-xs font-semibold text-white">
                {categoryLabel}
              </span>
              {post.tags.slice(0, 3).map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${tag}`}
                  className="rounded-full border border-white/30 px-3 py-1 text-xs text-white/70 transition hover:border-white/60 hover:text-white"
                >
                  #{tag}
                </Link>
              ))}
            </div>

            <h1 className="max-w-4xl font-display text-4xl font-bold leading-tight text-white md:text-6xl">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                {post.author_avatar ? (
                  <Image
                    src={post.author_avatar}
                    alt={post.author_name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                    {post.author_name[0]}
                  </div>
                )}
                <span>{post.author_name}</span>
              </div>
              <span>·</span>
              <span>{post.published_at ? formatInquiryDate(post.published_at) : ""}</span>
              <span>·</span>
              <span>{post.reading_time_min} хв читання</span>
              <BlogPostViews initialCount={post.views_count} />
            </div>
          </Container>
        </div>
      </section>

      {/* ── CONTENT ──────────────────────────────── */}
      <section className="py-14">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_280px]">
            <div>
              {/* Lead paragraph */}
              <p className="mb-8 border-l-4 border-[var(--color-primary)] pl-6 font-display text-xl italic leading-relaxed text-[var(--color-text-secondary)]">
                {post.excerpt}
              </p>

              {/* HTML content */}
              <div
                className="prose prose-stone prose-lg max-w-none prose-headings:font-display prose-headings:text-[var(--color-text-primary)] prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-3xl prose-h3:mt-8 prose-h3:text-2xl prose-p:leading-relaxed prose-p:text-[var(--color-text-secondary)] prose-a:text-[var(--color-primary)] prose-a:no-underline hover:prose-a:underline prose-strong:text-[var(--color-text-primary)] prose-blockquote:rounded-r-xl prose-blockquote:border-l-[var(--color-primary)] prose-blockquote:bg-[var(--color-bg-warm)] prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:font-display prose-blockquote:text-xl prose-blockquote:italic prose-img:rounded-2xl prose-img:shadow-md"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-12 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-8">
                  <span className="text-sm text-[var(--color-text-muted)]">Теги:</span>
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${tag}`}
                      className="rounded-full border border-[var(--color-border)] px-3 py-1 text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Like + Share */}
              <div className="mt-8 flex items-center gap-4 border-t border-[var(--color-border)] pt-8">
                <BlogPostLike slug={post.slug} initialCount={post.likes_count} />
                <BlogShareButtons title={post.title} />
              </div>

              {/* Author card */}
              <div className="mt-10 flex gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-warm)] p-6">
                {post.author_avatar ? (
                  <Image
                    src={post.author_avatar}
                    alt={post.author_name}
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-100)] font-display text-2xl text-[var(--color-primary)]">
                    {post.author_name[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {post.author_name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Команда майстерні Svitlytsya — ділимось досвідом, порадами та натхненням.
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-8">
                <BlogTableOfContents content={post.content} />
                <BlogShareButtons title={post.title} vertical />
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {/* ── RELATED ──────────────────────────────── */}
      {related.length > 0 && (
        <section className="border-t border-[var(--color-border)] bg-[var(--color-bg-warm)] py-14">
          <Container>
            <h2 className="mb-8 font-display text-3xl text-[var(--color-text-primary)]">
              Читайте також
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {related.map((p, i) => (
                <BlogCard key={p.id} post={p} index={i} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </article>
  );
}
