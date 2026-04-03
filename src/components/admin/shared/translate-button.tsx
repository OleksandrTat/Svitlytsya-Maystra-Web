"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";

type TranslateTable = "products" | "services" | "blog_posts" | "faq_items" | "certificates";

interface TranslateButtonProps {
  table: TranslateTable;
  id: string;
  fields: Record<string, string>;
  onSuccess?: (translations: Record<string, string>) => void;
}

export function TranslateButton({ table, id, fields, onSuccess }: TranslateButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, id, fields }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; translations?: Record<string, string> };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Translation failed");
        return;
      }
      toast.success("Переклад збережено");
      onSuccess?.(data.translations ?? {});
    } catch {
      toast.error("Translation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleTranslate()}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-warm)] disabled:opacity-50"
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Languages size={12} />
      )}
      EN переклад
    </button>
  );
}
