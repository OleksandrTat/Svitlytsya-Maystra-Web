"use client";

import Image from "next/image";
import Link from "next/link";
import { GitCompare } from "lucide-react";
import { useComparison } from "@/hooks/use-comparison";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  showStatus?: boolean;
};

export function ProductCard({ product, showStatus = false }: Props) {
  const { toggle, isInComparison, isFull } = useComparison();
  const inComparison = isInComparison(product.id);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-bg-section)]">
        {product.cover_image ? (
          <Image
            src={product.cover_image}
            alt={product.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-secondary)]">
            Немає зображення
          </div>
        )}
        {product.is_featured ? (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-semibold text-white">
            Featured
          </span>
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            toggle(product.id);
          }}
          disabled={isFull && !inComparison}
          className={cn(
            "absolute right-3 top-3 rounded-full p-1.5 text-xs transition",
            inComparison
              ? "bg-[var(--color-primary)] text-white"
              : "bg-white/90 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]",
            isFull && !inComparison && "cursor-not-allowed opacity-50",
          )}
          title={inComparison ? "Прибрати з порівняння" : "Додати до порівняння"}
        >
          <GitCompare size={14} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
            {PRODUCT_CATEGORY_LABELS[product.category as keyof typeof PRODUCT_CATEGORY_LABELS] ??
              product.category}
          </p>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            <Link href={`/products/${product.slug}`} className="hover:underline">
              {product.title}
            </Link>
          </h3>
        </div>

        {product.short_description ? (
          <p className="text-sm text-[var(--color-text-secondary)]">{product.short_description}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between text-sm">
          <span className="font-semibold text-[var(--color-primary)]">
            {product.price_from
              ? `від ${product.price_from.toLocaleString("uk-UA")} грн`
              : "Ціна за запитом"}
          </span>
          {showStatus ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                product.status === "active"
                  ? "bg-emerald-100 text-emerald-800"
                  : product.status === "draft"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-zinc-100 text-zinc-500",
              )}
            >
              {PRODUCT_STATUS_LABELS[product.status]}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
