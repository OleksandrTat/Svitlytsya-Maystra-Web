"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";

type ProductResult = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  price_from: number | null;
  cover_image?: string | null;
};

export function SimilarProductsSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) {
      return;
    }
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

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={18} className="text-[var(--color-secondary)]" />
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">AI-пошук продукту</h3>
      </div>
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
        Опишіть що вам потрібно — ми знайдемо найближчі варіанти.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && search()}
          placeholder="Наприклад: дубові двері для вхідної групи у класичному стилі"
          className="flex-1 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading || !query.trim()}
          className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "..." : <Search size={16} />}
        </button>
      </div>

      {searched && results.length === 0 && !loading && (
        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Нічого не знайдено. Спробуйте інший опис.
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {results.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="overflow-hidden rounded-xl border border-[var(--color-border)] transition hover:border-[var(--color-primary)]"
            >
              {product.cover_image && (
                <div className="relative h-32">
                  <Image src={product.cover_image} alt={product.title} fill className="object-cover" />
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {product.title}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  {product.category}
                  {product.price_from && ` · від ${product.price_from.toLocaleString("uk-UA")} грн`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
