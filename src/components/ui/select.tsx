import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: Props) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-lg border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-text-primary)] transition-all duration-200 focus-visible:border-[var(--color-primary-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-300)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

