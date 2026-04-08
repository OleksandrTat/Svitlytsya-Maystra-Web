"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { useLocale } from "next-intl";
import { Sparkles, Search, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";

type ProductResult = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  price_from: number | null;
  cover_image?: string | null;
};

const UI = {
  uk: {
    label: "AI-пошук",
    title: "Знайти продукт описом",
    placeholder: "Опишіть що шукаєте — матеріал, стиль, призначення…",
    button: "Знайти",
    empty: "Нічого не знайдено. Спробуйте інший опис.",
    hint: "Наприклад: «дубові двері для вхідної групи у класичному стилі»",
    results: "Результати",
    from: "від",
    currency: "грн",
  },
  en: {
    label: "AI Search",
    title: "Find a product by description",
    placeholder: "Describe what you need — material, style, purpose…",
    button: "Search",
    empty: "Nothing found. Try a different description.",
    hint: "E.g. «oak doors for an entrance hall in a classic style»",
    results: "Results",
    from: "from",
    currency: "UAH",
  },
};

export function SimilarProductsSearch() {
  const locale = useLocale();
  const ui = UI[locale as keyof typeof UI] ?? UI.uk;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch("/api/ai/similar-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = (await response.json()) as { ok: boolean; products?: ProductResult[] };
      setResults(data.products ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-primary-100)] to-transparent px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
          <Sparkles size={13} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">{ui.label}</p>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{ui.title}</p>
        </div>
      </div>

      {/* Search input */}
      <div className="p-4">
        <div className={cn(
          "flex items-center gap-2 rounded-xl border bg-[var(--color-surface)] px-3 py-2.5 transition-all",
          "focus-within:border-[var(--color-primary)] focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--color-primary)]/10",
          loading ? "border-[var(--color-primary)]/50" : "border-[var(--color-border)]",
        )}>
          <Search size={15} className="shrink-0 text-[var(--color-text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void search()}
            placeholder={ui.placeholder}
            className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
          />
          {query && (
            <button type="button" onClick={clear} className="shrink-0 rounded p-0.5 text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]">
              <X size={13} />
            </button>
          )}
        </div>

        {!searched && (
          <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">{ui.hint}</p>
        )}

        <button
          type="button"
          onClick={() => void search()}
          disabled={loading || !query.trim()}
          className={cn(
            "mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
            loading || !query.trim()
              ? "cursor-not-allowed bg-[var(--color-surface)] text-[var(--color-text-muted)]"
              : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-700)] hover:shadow-md",
          )}
        >
          {loading ? (
            <>
              <Sparkles size={14} className="animate-pulse" />
              AI…
            </>
          ) : (
            <>
              <Sparkles size={14} />
              {ui.button}
            </>
          )}
        </button>

        {/* Results */}
        {searched && !loading && results.length === 0 && (
          <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">{ui.empty}</p>
        )}

        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{ui.results}</p>
            {results.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group flex items-center gap-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 transition-all hover:border-[var(--color-primary)] hover:bg-white hover:shadow-sm"
              >
                {product.cover_image ? (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    <Image src={product.cover_image} alt={product.title} fill className="object-cover" sizes="48px" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--color-border)]">
                    <Search size={16} className="text-[var(--color-text-muted)]" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">
                    {product.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                    {PRODUCT_CATEGORY_LABELS[product.category as keyof typeof PRODUCT_CATEGORY_LABELS] ?? product.category}
                    {product.price_from != null && (
                      <span className="ml-1 font-medium text-[var(--color-primary)]">
                        · {ui.from} {product.price_from.toLocaleString(locale === "uk" ? "uk-UA" : "en-US")} {ui.currency}
                      </span>
                    )}
                  </p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-[var(--color-text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
