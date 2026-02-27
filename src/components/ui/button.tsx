import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-700)] border border-[var(--color-primary)]",
  secondary:
    "bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-surface)] border border-[var(--color-primary)]",
  ghost:
    "bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] border border-transparent",
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

