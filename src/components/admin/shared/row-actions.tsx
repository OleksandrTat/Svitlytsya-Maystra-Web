"use client";

import Link from "next/link";
import { useTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RowAction = {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => Promise<void> | void;
  variant?: "default" | "danger";
};

export function RowActions({ actions }: { actions: RowAction[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/row:opacity-100">
      {actions.map((action) => {
        const className = cn(
          "rounded-md p-1.5 transition",
          action.variant === "danger"
            ? "text-red-500 hover:bg-red-50"
            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-100)] hover:text-[var(--color-primary)]",
        );

        if (action.href) {
          return (
            <Link key={`${action.label}-${action.href}`} href={action.href} title={action.label} className={className}>
              {action.icon}
            </Link>
          );
        }

        return (
          <button
            key={action.label}
            type="button"
            title={action.label}
            disabled={pending}
            className={className}
            onClick={() => {
              if (!action.onClick) {
                return;
              }
              startTransition(async () => {
                await action.onClick?.();
              });
            }}
          >
            {action.icon}
          </button>
        );
      })}
    </div>
  );
}

