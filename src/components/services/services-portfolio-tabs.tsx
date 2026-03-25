"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  services: Service[];
};

const CATEGORY_ORDER = ["doors", "furniture", "windows", "restoration"] as const;

export function ServicesPortfolioTabs({ services }: Props) {
  const availableTabs = CATEGORY_ORDER.filter((cat) =>
    services.some((s) => s.category === cat && s.gallery.length > 0),
  );

  const [activeTab, setActiveTab] = useState(availableTabs[0] ?? "doors");

  if (availableTabs.length === 0) return null;

  const activeService = services.find(
    (s) => s.category === activeTab && s.gallery.length > 0,
  );
  const images = activeService?.gallery ?? [];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-8 flex gap-6 border-b border-[var(--color-border)]">
        {availableTabs.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveTab(cat)}
            className={cn(
              "relative pb-3 text-sm font-medium transition-colors",
              activeTab === cat
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
            )}
          >
            {PRODUCT_CATEGORY_LABELS[cat as keyof typeof PRODUCT_CATEGORY_LABELS] ?? cat}
            {activeTab === cat && (
              <motion.div
                layoutId="portfolio-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                transition={{ duration: 0.25 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Gallery grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {images.slice(0, 6).map((src, i) => (
            <div
              key={src}
              className="relative aspect-[4/3] overflow-hidden rounded-xl transition-transform duration-300 hover:scale-[1.02]"
            >
              <Image
                src={src}
                alt={`${activeService?.title ?? ""} — фото ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {images.length === 0 && (
        <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
          Поки що немає фото для цієї категорії
        </p>
      )}
    </div>
  );
}
