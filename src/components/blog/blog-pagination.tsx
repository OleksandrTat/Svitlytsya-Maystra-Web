import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
};

export function BlogPagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: Props) {
  if (totalPages <= 1) {
    return null;
  }

  const buildUrl = (page: number) => {
    const params = new URLSearchParams({ ...searchParams, page: String(page) });
    return `${basePath}?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Пагінація">
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
          className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-surface)]"
        >
          ← Назад
        </Link>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={buildUrl(page)}
          className={cn(
            "h-9 w-9 rounded-full border text-sm font-medium transition",
            page === currentPage
              ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
              : "border-[var(--color-border)] hover:bg-[var(--color-surface)]",
          )}
          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link
          href={buildUrl(currentPage + 1)}
          className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-surface)]"
        >
          Далі →
        </Link>
      )}
    </nav>
  );
}
