import { cn } from "@/lib/utils";

export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-3xl border border-[var(--color-border)] bg-white p-5", className)}>
      {children}
    </section>
  );
}

