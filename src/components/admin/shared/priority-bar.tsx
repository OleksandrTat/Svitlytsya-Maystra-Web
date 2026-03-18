"use client";

import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (next: number) => void;
  label?: string;
  className?: string;
};

const LABELS: Record<number, string> = {
  1: "Найнижчий",
  2: "Дуже низький",
  3: "Низький",
  4: "Нижче середнього",
  5: "Середній",
  6: "Вище середнього",
  7: "Високий",
  8: "Дуже високий",
  9: "Критичний",
  10: "Найвищий",
};

function getSegmentColor(index: number, active: boolean) {
  if (!active) {
    return "bg-[var(--color-border)]";
  }

  if (index <= 3) {
    return "bg-emerald-400";
  }

  if (index <= 6) {
    return "bg-amber-400";
  }

  if (index <= 8) {
    return "bg-orange-500";
  }

  return "bg-red-500";
}

export function PriorityBar({ value, onChange, label, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">{label}</p>
          <span className="text-xs font-semibold text-[var(--color-text-primary)]">
            {value} - {LABELS[value]}
          </span>
        </div>
      ) : null}

      <div className="flex items-center gap-1">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((segment) => (
          <button
            key={segment}
            type="button"
            title={`${segment} - ${LABELS[segment]}`}
            onClick={() => onChange(segment)}
            className={cn(
              "h-6 flex-1 rounded transition-all duration-150 hover:scale-y-125 focus:outline-none",
              getSegmentColor(segment, segment <= value),
            )}
          />
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-[var(--color-text-secondary)]">
        <span>1 - низький</span>
        <span>5 - середній</span>
        <span>10 - максимум</span>
      </div>
    </div>
  );
}
