import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: Props) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

