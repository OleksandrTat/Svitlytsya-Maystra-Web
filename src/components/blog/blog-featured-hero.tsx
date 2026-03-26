"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { BLOG_CATEGORY_LABELS } from "@/lib/constants";
import type { BlogPost } from "@/lib/types";
import { formatInquiryDate } from "@/lib/utils";

export function BlogFeaturedHero({ post }: { post: BlogPost }) {
  const categoryLabel = BLOG_CATEGORY_LABELS[post.category] ?? post.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-14 overflow-hidden rounded-2xl"
    >
      <div className="grid md:grid-cols-2">
        {/* Image */}
        <Link href={`/blog/${post.slug}`} className="relative block aspect-[4/3] overflow-hidden">
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[var(--color-bg-warm)]">
              <span className="font-display text-6xl text-[var(--color-border)]">✦</span>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex flex-col justify-center bg-[var(--color-bg-dark)] p-8 md:p-10">
          <span className="mb-4 inline-block w-fit rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white">
            {categoryLabel}
          </span>

          <Link href={`/blog/${post.slug}`}>
            <h2 className="font-display text-3xl font-bold leading-tight text-white md:text-[40px]">
              {post.title}
            </h2>
          </Link>

          <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-white/70">
            {post.excerpt}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/50">
            <span>{post.author_name}</span>
            <span>·</span>
            <span>{post.published_at ? formatInquiryDate(post.published_at) : ""}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              {post.reading_time_min} хв
            </span>
          </div>

          <Link
            href={`/blog/${post.slug}`}
            className="mt-8 inline-flex w-fit items-center rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)]"
          >
            Читати статтю &rarr;
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
