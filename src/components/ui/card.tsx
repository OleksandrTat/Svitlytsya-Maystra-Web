import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  variant?: "surface" | "white" | "warm";
  hover?: boolean;
};

const variantStyles = {
  surface: "bg-[var(--color-bg-section)]",
  white: "bg-white",
  warm: "bg-[var(--color-surface)]",
};

export function Card({ children, className, variant = "warm", hover = false }: Props) {
  return (
    <article
      className={cn(
        "rounded-3xl border border-[var(--color-border)] p-6",
        variantStyles[variant],
        hover && "card-hover",
        className,
      )}
    >
      {children}
    </article>
  );
}

