"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { GitCompare } from "lucide-react";
import { useComparison } from "@/hooks/use-comparison";
import { useMaterialLabel } from "@/components/products/attribute-labels-context";
import { WishlistButton } from "@/components/products/wishlist-button";
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
  const materialLabel = useMaterialLabel();

  const categoryLabel =
    PRODUCT_CATEGORY_LABELS[product.category as keyof typeof PRODUCT_CATEGORY_LABELS] ??
    product.category;

  return (
    <motion.article
      layout
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl"
    >
      {/* Image area */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-[var(--color-bg-section)]"
      >
        {product.cover_image ? (
          <Image
            src={product.cover_image}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-secondary)]">
            Немає зображення
          </div>
        )}

        {/* Wishlist button */}
        <WishlistButton
          productId={product.id}
          productTitle={product.title}
          className="absolute left-3 top-3 z-20"
        />

        {/* Featured badge */}
        {product.is_featured && (
          <span className="absolute left-3 top-12 z-10 rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-[10px] font-semibold text-white">
            Популярне
          </span>
        )}

        {/* Category badge */}
        <span className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-text-primary)] backdrop-blur-sm">
          {categoryLabel}
        </span>

        {/* Hover overlay */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <span className="rounded-full border border-white px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white hover:text-[var(--color-text-primary)]">
              Детальніше →
            </span>
          </motion.div>
        </AnimatePresence>
      </Link>

      {/* Comparison button */}
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggle(product.id);
        }}
        disabled={isFull && !inComparison}
        className={cn(
          "absolute right-3 top-3 z-20 rounded-full p-1.5 text-xs transition",
          inComparison
            ? "bg-[var(--color-primary)] text-white"
            : "bg-white/90 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]",
          isFull && !inComparison && "cursor-not-allowed opacity-50",
        )}
        title={inComparison ? "Прибрати з порівняння" : "Додати до порівняння"}
      >
        <GitCompare size={14} />
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-display text-xl font-semibold leading-tight text-[var(--color-text-primary)]">
          <Link href={`/products/${product.slug}`} className="hover:text-[var(--color-primary)]">
            {product.title}
          </Link>
        </h3>

        {/* Material tags */}
        {product.materials.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.materials.slice(0, 3).map((material) => (
              <span
                key={material}
                className="rounded-full bg-[var(--color-bg-warm)] px-2 py-0.5 text-[11px] text-[var(--color-text-muted)]"
              >
                {materialLabel(material)}
              </span>
            ))}
            {product.materials.length > 3 && (
              <span className="rounded-full bg-[var(--color-bg-warm)] px-2 py-0.5 text-[11px] text-[var(--color-text-muted)]">
                +{product.materials.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="mt-auto border-t border-[var(--color-border)]" />

        {/* Price + Order */}
        <div className="flex items-center justify-between">
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
          ) : (
            <Link
              href="/contact"
              className="rounded-full border border-[var(--color-primary)] px-3 py-1 text-sm text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
            >
              Замовити
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}
