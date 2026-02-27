import { PROJECT_CATEGORY_LABELS, PROJECT_STATUS_LABELS } from "@/lib/constants";
import type { ProjectCategory, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryBadge({ category }: { category: ProjectCategory }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
      {PROJECT_CATEGORY_LABELS[category]}
    </span>
  );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const className =
    status === "public"
      ? "bg-emerald-50 text-emerald-700"
      : status === "concept"
        ? "bg-amber-50 text-amber-700"
        : "bg-zinc-100 text-zinc-600";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        className,
      )}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

