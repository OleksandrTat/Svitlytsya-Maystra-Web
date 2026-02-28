import Link from "next/link";

type BlogFiltersProps = {
  categories: string[];
  activeCategory?: string;
};

export function BlogFilters({ categories, activeCategory }: BlogFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        className={`rounded-full border px-3 py-1 text-sm ${
          !activeCategory
            ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
            : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
        }`}
      >
        Усі
      </Link>
      {categories.map((category) => (
        <Link
          key={category}
          href={`/blog?category=${encodeURIComponent(category)}`}
          className={`rounded-full border px-3 py-1 text-sm ${
            activeCategory === category
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
              : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
          }`}
        >
          {category}
        </Link>
      ))}
    </div>
  );
}
