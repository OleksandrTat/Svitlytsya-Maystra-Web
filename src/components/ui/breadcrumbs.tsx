import Link from "next/link";
import { cn } from "@/lib/utils";

type Crumb = {
  label: string;
  href?: string;
};

export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-1 text-sm text-[var(--color-text-secondary)]",
        className,
      )}
    >
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1">
          {index > 0 ? <span className="opacity-40">/</span> : null}
          {item.href ? (
            <Link href={item.href} className="transition hover:text-[var(--color-primary)]">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--color-text-primary)]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
