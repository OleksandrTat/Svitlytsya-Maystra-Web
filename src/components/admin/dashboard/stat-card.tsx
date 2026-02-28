import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number;
  delta?: number;
  icon: ReactNode;
  href?: string;
  urgent?: boolean;
};

export function StatCard({ label, value, delta, icon, href, urgent }: StatCardProps) {
  const isUrgent = Boolean(urgent && value > 0);

  const content = (
    <>
      <div className={cn("rounded-lg p-3", isUrgent ? "bg-red-100" : "bg-[var(--color-primary-100)]")}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[var(--color-text-primary)]">{value}</span>
          {typeof delta === "number" ? (
            <span className={cn("text-xs", delta >= 0 ? "text-emerald-600" : "text-red-600")}>
              {delta >= 0 ? `+${delta}` : delta} vs тиждень
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  const className = cn(
    "flex items-center gap-4 rounded-xl border bg-white p-5 transition-all duration-200",
    isUrgent
      ? "border-red-200 bg-red-50 hover:shadow-red-100"
      : "border-[var(--color-border)] hover:shadow-md",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
