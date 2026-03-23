import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import type { Product, Service } from "@/lib/types";

type Props = {
  products: Product[];
  services: Service[];
  currentCategory: string;
};

export function RelatedProducts({ products, services, currentCategory }: Props) {
  if (products.length === 0 && services.length === 0) {
    return null;
  }

  const currentCategoryLabel =
    PRODUCT_CATEGORY_LABELS[currentCategory as keyof typeof PRODUCT_CATEGORY_LABELS] ??
    currentCategory;

  return (
    <section className="border-t border-[var(--color-border)] py-14">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
          {currentCategoryLabel}
        </p>
        <h2 className="mt-2 font-display text-2xl text-[var(--color-text-primary)]">
          З цим також замовляють
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative h-40 overflow-hidden bg-[var(--color-surface)]">
                {product.cover_image ? (
                  <Image
                    src={product.cover_image}
                    alt={product.title}
                    fill
                    className="object-cover transition group-hover:scale-[1.03]"
                    sizes="400px"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--color-border)]">
                    Немає фото
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {PRODUCT_CATEGORY_LABELS[
                    product.category as keyof typeof PRODUCT_CATEGORY_LABELS
                  ] ?? product.category}
                </p>
                <p className="mt-1 font-semibold text-[var(--color-text-primary)]">
                  {product.title}
                </p>
                <p className="mt-1 text-sm text-[var(--color-primary)]">
                  {product.price_from
                    ? `від ${product.price_from.toLocaleString("uk-UA")} грн`
                    : "Ціна за запитом"}
                </p>
              </div>
            </Link>
          ))}

          {services.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-100)] text-2xl">
                {service.icon ?? "🔧"}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[var(--color-text-secondary)]">Послуга</p>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {service.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">
                  {service.short_description}
                </p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-[var(--color-primary)]" />
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
