"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  currentPage: number;
  totalPages: number;
};

export function ProductsPagination({ currentPage, totalPages }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-surface)]"
        >
          ←
        </Link>
      ) : null}

      {pages.map((page) => (
        <Link
          key={page}
          href={buildUrl(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={cn(
            "rounded-xl border px-3 py-2 text-sm",
            page === currentPage
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
              : "border-[var(--color-border)] hover:bg-[var(--color-surface)]",
          )}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-surface)]"
        >
          →
        </Link>
      ) : null}
    </nav>
  );
}
