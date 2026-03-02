"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOrderTemplatesAction } from "@/actions/admin/settings";
import { parseOrderTemplates, type OrderTemplate } from "@/lib/admin/config";

export function OrderTemplatesSettings({ initial }: { initial: OrderTemplate[] }) {
  const [rawJson, setRawJson] = useState(() => JSON.stringify(initial, null, 2));
  const [pending, startTransition] = useTransition();

  const save = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      toast.error("JSON невалідний. Перевірте формат шаблонів.");
      return;
    }

    const normalized = parseOrderTemplates(parsed);

    startTransition(() => {
      updateOrderTemplatesAction(normalized).then((result) => {
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        setRawJson(JSON.stringify(normalized, null, 2));
        toast.success("Шаблони замовлень оновлено.");
      });
    });
  };

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Шаблони замовлень</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          JSON-список типових шаблонів для швидкого створення замовлень.
        </p>
      </div>
      <textarea
        value={rawJson}
        onChange={(event) => setRawJson(event.target.value)}
        className="min-h-48 w-full rounded-xl border border-[var(--color-border)] px-3 py-2 font-mono text-xs"
      />
      <div className="mt-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Зберігаємо..." : "Зберегти шаблони"}
        </button>
      </div>
    </section>
  );
}
