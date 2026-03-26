"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { BLOG_CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  categories: { category: string; count: number }[];
  tags: string[];
  activeCategory?: string;
  activeTag?: string;
};

export function BlogFiltersBar({ categories, tags, activeCategory, activeTag }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const navigate = useCallback(
    (params: Record<string, string | undefined>) => {
      const sp = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value) sp.set(key, value);
      }
      router.push(`/blog${sp.toString() ? `?${sp.toString()}` : ""}`);
    },
    [router],
  );

  const handleCategoryClick = (cat?: string) => {
    navigate({ category: cat, tag: activeTag });
  };

  const handleTagClick = (tag: string) => {
    navigate({ category: activeCategory, tag: activeTag === tag ? undefined : tag });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.trim()) {
        router.push(`/blog?search=${encodeURIComponent(value.trim())}`);
      } else {
        navigate({ category: activeCategory, tag: activeTag });
      }
    }, 400);
  };

  return (
    <div className="mt-8 space-y-4">
      {/* Categories */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleCategoryClick(undefined)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            !activeCategory
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-bg-warm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-100)] hover:text-[var(--color-primary)]",
          )}
        >
          Всі
        </button>
        {categories.map((cat) => (
          <button
            key={cat.category}
            type="button"
            onClick={() => handleCategoryClick(cat.category)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              activeCategory === cat.category
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-bg-warm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-100)] hover:text-[var(--color-primary)]",
            )}
          >
            {BLOG_CATEGORY_LABELS[cat.category] ?? cat.category}
            <span className="ml-1 opacity-60">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Tags + Search */}
      <div className="flex flex-wrap items-center gap-3">
        {tags.slice(0, 10).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              activeTag === tag
                ? "border-[var(--color-primary)] bg-[var(--color-primary-100)] text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
            )}
          >
            #{tag}
          </button>
        ))}

        <div className="relative ml-auto">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Пошук статей..."
            className="h-9 w-48 rounded-full border border-[var(--color-border)] bg-white pl-9 pr-8 text-sm outline-none transition-shadow focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
