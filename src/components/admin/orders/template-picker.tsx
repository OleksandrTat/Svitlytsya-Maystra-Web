"use client";

import { toast } from "sonner";
import type { OrderTemplate } from "@/lib/admin/config";

export function TemplatePicker({
  templates,
  onSelect,
}: {
  templates: OrderTemplate[];
  onSelect: (defaults: Record<string, unknown>) => void;
}) {
  return (
    <section>
      <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">Швидкий шаблон:</p>
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => {
              onSelect(template.defaults as Record<string, unknown>);
              toast.info(`Шаблон "${template.name}" застосовано.`);
            }}
            className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-100)] hover:text-[var(--color-primary)]"
          >
            {template.name}
          </button>
        ))}
      </div>
    </section>
  );
}
