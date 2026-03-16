import Image from "next/image";
import Link from "next/link";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  showStatus?: boolean;
};

export function ProductCard({ product, showStatus = false }: Props) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white transition hover:-translate-y-1 hover:shadow-lg">
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
        {product.is_featured && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-semibold text-white">
            Featured
          </span>
        )}
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
          <p className="text-sm text-[var(--color-text-secondary)]">
            {product.short_description}
          </p>
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
