import Image from "next/image";
import Link from "next/link";

type BlogCardPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  category: string;
  reading_time_min: number;
  published_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Без дати";
  }
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function BlogCard({ post }: { post: BlogCardPost }) {
  return <BlogCardWithPath post={post} basePath="/blog" />;
}

export function BlogCardWithPath({
  post,
  basePath,
}: {
  post: BlogCardPost;
  basePath: "/blog" | "/cultural";
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">
      <Link href={`${basePath}/${post.slug}`} className="block">
        <div className="relative h-52">
          <Image
            src={post.cover_image || "/window.svg"}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        </div>
      </Link>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="rounded-full bg-[var(--color-surface)] px-2 py-1">{post.category}</span>
          <span>{formatDate(post.published_at)}</span>
          <span>{post.reading_time_min} хв</span>
        </div>

        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          <Link href={`${basePath}/${post.slug}`}>{post.title}</Link>
        </h3>
        <p className="line-clamp-3 text-sm text-[var(--color-text-secondary)]">{post.excerpt}</p>
      </div>
    </article>
  );
}
