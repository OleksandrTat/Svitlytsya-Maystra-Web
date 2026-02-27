import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeading({ eyebrow, title, description, className }: Props) {
  return (
    <div className={cn("max-w-3xl space-y-4", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-secondary)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-3xl leading-tight text-[var(--color-text-primary)] md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-7 text-[var(--color-text-secondary)] md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

