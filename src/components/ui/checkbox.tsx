import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Checkbox({ className, label, ...props }: Props) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
      <input
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-secondary)]",
          className,
        )}
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

