"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";

type TranslateTable = "products" | "services" | "blog_posts" | "faq_items" | "certificates";

interface TranslateAllButtonProps {
  table: TranslateTable;
  items: Array<{ id: string; fields: Record<string, string> }>;
  onComplete?: () => void;
}

export function TranslateAllButton({ table, items, onComplete }: TranslateAllButtonProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleTranslateAll = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setProgress(0);
    let done = 0;
    let errors = 0;

    for (const item of items) {
      try {
        const res = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table, id: item.id, fields: item.fields }),
        });
        const data = (await res.json()) as { ok?: boolean };
        if (!res.ok || !data.ok) errors++;
      } catch {
        errors++;
      }
      done++;
      setProgress(Math.round((done / items.length) * 100));
    }

    setLoading(false);
    if (errors === 0) {
      toast.success(`Перекладено ${items.length} записів`);
    } else {
      toast.warning(`Перекладено з помилками: ${errors} з ${items.length}`);
    }
    onComplete?.();
  };

  return (
    <button
      type="button"
      onClick={() => void handleTranslateAll()}
      disabled={loading || items.length === 0}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-warm)] disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 size={12} className="animate-spin" />
          {progress}%
        </>
      ) : (
        <>
          <Languages size={12} />
          Перекласти все EN ({items.length})
        </>
      )}
    </button>
  );
}
