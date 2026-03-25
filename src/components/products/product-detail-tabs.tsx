"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  description: string;
  materials: string[];
};

const TABS = [
  { id: "description", label: "Опис" },
  { id: "materials", label: "Матеріали" },
  { id: "delivery", label: "Доставка і гарантія" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProductDetailTabs({ description, materials }: Props) {
  const [active, setActive] = useState<TabId>("description");

  return (
    <div>
      {/* Tab headers */}
      <div className="flex gap-6 border-b border-[var(--color-border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "relative pb-3 text-sm font-medium transition-colors",
              active === tab.id
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
            )}
          >
            {tab.label}
            {active === tab.id && (
              <motion.div
                layoutId="product-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                transition={{ duration: 0.25 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="pt-6"
        >
          {active === "description" && (
            <div className="prose max-w-none text-[var(--color-text-secondary)] prose-headings:font-display prose-headings:text-[var(--color-text-primary)]">
              <p className="whitespace-pre-line leading-relaxed">{description}</p>
            </div>
          )}

          {active === "materials" && (
            <div>
              {materials.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {materials.map((material) => (
                    <div
                      key={material}
                      className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-warm)] px-4 py-3"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-100)] text-sm font-semibold text-[var(--color-primary)]">
                        {material.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {material}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Інформація про матеріали відсутня.
                </p>
              )}
            </div>
          )}

          {active === "delivery" && (
            <div className="space-y-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">Доставка</h3>
                <p className="mt-1">
                  Доставка здійснюється по всій Україні. Вартість та терміни доставки
                  розраховуються індивідуально залежно від габаритів виробу та адреси.
                  Можливий самовивіз з майстерні.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">Монтаж</h3>
                <p className="mt-1">
                  Пропонуємо професійний монтаж нашою командою. Вартість монтажу
                  узгоджується окремо після виміру на об&rsquo;єкті.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">Гарантія</h3>
                <p className="mt-1">
                  На всі вироби надається гарантія 3 роки. Гарантія покриває дефекти
                  матеріалів та виготовлення. За детальними умовами зверніться до менеджера.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
