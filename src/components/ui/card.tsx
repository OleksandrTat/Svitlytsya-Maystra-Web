import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: Props) {
  return (
    <article
      className={cn(
        "rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6",
        className,
      )}
    >
      {children}
    </article>
  );
}

