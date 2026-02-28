import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/blog/comment-section";
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
    .from("cultural_blog_posts")
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
    .from("cultural_blog_posts")
    .select("title, seo_title, seo_description, cover_image")
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
    },
  };
}

export default async function CulturalArticlePage({
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
    .from("cultural_blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!post) {
    notFound();
  }

  return (
    <section className="py-12">
      <Container className="max-w-4xl">
        <div className="mb-5 text-sm text-[var(--color-text-secondary)]">
          <Link href="/" className="underline">
            Головна
          </Link>{" "}
          /{" "}
          <Link href="/cultural" className="underline">
            Культурний блог
          </Link>{" "}
          / <span>{post.title}</span>
        </div>

        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">{post.title}</h1>
        <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
          {post.guest_author_name ? `Автор: ${post.guest_author_name}` : "Автор: Svitlytsya Maystra"}
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

        {post.allow_comments ? <CommentSection postId={post.id} postSlug={post.slug} /> : null}
      </Container>
    </section>
  );
}
