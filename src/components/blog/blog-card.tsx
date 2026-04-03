"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BLOG_CATEGORY_LABELS } from "@/lib/constants";
import type { BlogPost } from "@/lib/types";
import { formatInquiryDate } from "@/lib/utils";

export function BlogCard({ post, index = 0 }: { post: BlogPost; index?: number }) {
  const t = useTranslations("blog");
  const categoryLabel = BLOG_CATEGORY_LABELS[post.category] ?? post.category;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition-shadow duration-300 hover:shadow-xl"
    >
      <Link href={`/blog/${post.slug}`} className="block overflow-hidden">
        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--color-bg-warm)]">
          {post.cover_image ? (
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-display text-4xl text-[var(--color-border)]">✦</span>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-[var(--color-primary)]/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {categoryLabel}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <span>{post.published_at ? formatInquiryDate(post.published_at) : t("draft")}</span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {t("readingTime", { minutes: post.reading_time_min })}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={11} />
            {post.views_count}
          </span>
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h2 className="line-clamp-2 font-display text-xl font-semibold leading-snug text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-primary)]">
            {post.title}
          </h2>
        </Link>

        <p className="mt-2 flex-1 line-clamp-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {post.excerpt}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--color-bg-warm)] px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]"
              >
                #{tag}
              </span>
            ))}
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">{post.author_name}</span>
        </div>
      </div>
    </motion.article>
  );
}
