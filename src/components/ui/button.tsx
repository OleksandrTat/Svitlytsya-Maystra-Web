import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "accent" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantStyles: Record<Variant, string> = {
  primary:
    "border border-[var(--color-primary)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-500)]",
  secondary:
    "border-2 border-[var(--color-primary)] bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary-100)]",
  accent:
    "border border-[var(--color-accent)] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-800)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary-100)] hover:underline",
  danger:
    "border border-[var(--color-error)] bg-[var(--color-error)] text-white hover:bg-[#9f2626]",
};

const sizeStyles: Record<Size, string> = {
  sm: "rounded px-4 py-2 text-sm",
  md: "rounded-lg px-6 py-3 text-base",
  lg: "rounded-xl px-8 py-4 text-lg",
};

export function Button({ className, variant = "primary", size = "md", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}

