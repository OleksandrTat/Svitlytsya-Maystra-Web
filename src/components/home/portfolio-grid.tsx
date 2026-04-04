"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

const CATEGORY_MAP: Record<string, Record<string, string>> = {
  door:        { uk: "Двері",       en: "Doors" },
  furniture:   { uk: "Меблі",       en: "Furniture" },
  window:      { uk: "Вікна",       en: "Windows" },
  restoration: { uk: "Реставрація", en: "Restoration" },
};

type Props = {
  products: Product[];
  t: {
    eyebrow: string;
    title: string;
    all: string;
    viewAll: string;
  };
};

export function PortfolioGrid({ products, t }: Props) {
  const locale = useLocale();

  const getCategoryLabel = (cat: string) =>
    CATEGORY_MAP[cat]?.[locale] ?? CATEGORY_MAP[cat]?.uk ?? cat;

  // Build unique category list from actual products
  const rawCategories = Array.from(new Set(products.map((p) => p.category)));
  const categories = [t.all, ...rawCategories];

  const [active, setActive] = useState(t.all);

  const filtered =
    active === t.all ? products : products.filter((p) => p.category === active);

  const getImage = (p: Product) =>
    p.cover_image ?? p.images?.[0] ?? null;

  return (
    <section className="section-padding">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              {t.eyebrow}
            </p>
            <h2 className="heading-h1 text-[var(--color-text-primary)]">
              {t.title}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition",
                  active === cat
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)] hover:text-[var(--color-text-primary)]",
                )}
              >
                {cat === t.all ? cat : getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid auto-rows-[200px] grid-cols-2 gap-4 md:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((product, index) => {
              const image = getImage(product);
              const isTall = index % 3 === 0;

              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.28 }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl bg-[var(--color-bg-section)]",
                    isTall && "row-span-2",
                  )}
                >
                  <Link
                    href={`/products/${product.slug}` as "/products"}
                    className="absolute inset-0 z-10"
                    aria-label={product.title}
                  />

                  {image ? (
                    <Image
                      src={image}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/10" />
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition duration-300 group-hover:opacity-100">
                    <div className="flex items-end justify-between p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-light)]">
                          {getCategoryLabel(product.category)}
                        </p>
                        <p className="mt-1 font-display text-base leading-tight text-white md:text-lg">
                          {product.title}
                        </p>
                      </div>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {products.length === 0 && (
          <p className="mt-10 text-center text-[var(--color-text-muted)]">
            Немає робіт для відображення
          </p>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] transition hover:gap-3"
          >
            {t.viewAll}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
