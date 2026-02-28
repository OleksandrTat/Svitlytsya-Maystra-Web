import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type Params = {
  slug: string;
};

export const revalidate = 300;

export async function generateStaticParams() {
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("is_published", true);

  return (data ?? []).map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());

  if (!supabase) {
    return {};
  }

  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, seo_description, seo_title, cover_image")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!post) {
    return {};
  }

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || undefined,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || undefined,
      images: post.cover_image ? [{ url: post.cover_image }] : [],
      type: "article",
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());

  if (!supabase) {
    notFound();
  }

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!post) {
    notFound();
  }

  const { data: relatedRaw } = await supabase
    .from("blog_posts")
    .select("id,title,slug,cover_image")
    .eq("is_published", true)
    .eq("category", post.category)
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(3);

  const related = relatedRaw ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    publisher: {
      "@type": "Organization",
      name: "Svitlytsya Maystra",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="py-12">
        <Container className="max-w-4xl">
          <div className="mb-5 text-sm text-[var(--color-text-secondary)]">
            <Link href="/" className="underline">
              Головна
            </Link>{" "}
            /{" "}
            <Link href="/blog" className="underline">
              Блог
            </Link>{" "}
            / <span>{post.title}</span>
          </div>

          <h1 className="font-display text-4xl text-[var(--color-text-primary)]">{post.title}</h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            {post.category} · {post.reading_time_min} хв читання
          </p>

          {post.cover_image ? (
            <div className="relative mt-6 h-[340px] overflow-hidden rounded-3xl">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 960px"
              />
            </div>
          ) : null}

          <article
            className="prose prose-neutral mt-8 max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-10 rounded-2xl bg-[var(--color-surface)] p-6 text-center">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Потрібна консультація по вашому проєкту?
            </h2>
            <Link
              href="/contact"
              className="mt-4 inline-flex rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Замовити консультацію
            </Link>
          </div>

          {related.length > 0 ? (
            <div className="mt-12">
              <h3 className="text-2xl font-semibold text-[var(--color-text-primary)]">Схожі статті</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blog/${item.slug}`}
                    className="rounded-2xl border border-[var(--color-border)] p-4 hover:bg-[var(--color-surface)]"
                  >
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}
