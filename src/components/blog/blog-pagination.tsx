import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  currentPage: number;
  totalPages: number;
  category?: string;
  tag?: string;
};

function buildHref(page: number, category?: string, tag?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (category) params.set("category", category);
  if (tag) params.set("tag", tag);
  const qs = params.toString();
  return `/blog${qs ? `?${qs}` : ""}`;
}

export function BlogPagination({ currentPage, totalPages, category, tag }: Props) {
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    }
  }

  return (
    <nav className="mt-12 flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Link
          href={buildHref(currentPage - 1, category, tag)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-warm)]"
        >
          <ChevronLeft size={18} />
        </Link>
      )}

      {pages.map((page, i) => {
        const prevPage = pages[i - 1];
        const showEllipsis = prevPage !== undefined && page - prevPage > 1;

        return (
          <span key={page} className="flex items-center">
            {showEllipsis && (
              <span className="flex h-10 w-10 items-center justify-center text-[var(--color-text-muted)]">
                ...
              </span>
            )}
            <Link
              href={buildHref(page, category, tag)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                page === currentPage
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)]",
              )}
            >
              {page}
            </Link>
          </span>
        );
      })}

      {currentPage < totalPages && (
        <Link
          href={buildHref(currentPage + 1, category, tag)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-warm)]"
        >
          <ChevronRight size={18} />
        </Link>
      )}
    </nav>
  );
}
