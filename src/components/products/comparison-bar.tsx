"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, GitCompare, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useComparison } from "@/hooks/use-comparison";
import type { Product } from "@/lib/types";

type Props = {
  products: Product[];
};

export function ComparisonBar({ products }: Props) {
  const { ids, clear, toggle, count } = useComparison();
  const selected = ids
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));

  return (
    <AnimatePresence>
      {count > 0 ? (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-white shadow-2xl"
        >
          <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-3 md:px-6">
            <div className="flex items-center gap-1 text-sm font-semibold text-[var(--color-text-primary)]">
              <GitCompare size={16} className="text-[var(--color-primary)]" />
              Порівняння ({count}/3)
            </div>

            <div className="flex flex-1 items-center gap-3 overflow-x-auto">
              {selected.map((product) => (
                <div
                  key={product.id}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
                >
                  {product.cover_image ? (
                    <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                      <Image
                        src={product.cover_image}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                  ) : null}
                  <span className="max-w-[120px] truncate text-xs font-medium">
                    {product.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(product.id)}
                    className="rounded-full p-0.5 hover:bg-[var(--color-border)]"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={clear}
                className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs"
              >
                Очистити
              </button>
              {count >= 2 ? (
                <Link
                  href={`/products/compare?ids=${ids.join(",")}`}
                  className="flex items-center gap-1 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white"
                >
                  Порівняти
                  <ArrowRight size={12} />
                </Link>
              ) : null}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
