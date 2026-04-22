"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  description: string;
  materials: string[];
};

type TabId = "description" | "materials" | "delivery";

export function ProductDetailTabs({ description, materials }: Props) {
  const t = useTranslations("productPage");
  const [active, setActive] = useState<TabId>("description");

  const tabs: { id: TabId; label: string }[] = [
    { id: "description", label: t("tabDescription") },
    { id: "materials", label: t("tabMaterials") },
    { id: "delivery", label: t("tabDelivery") },
  ];

  return (
    <div>
      {/* Tab headers */}
      <div className="flex gap-6 border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
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
                  {t("materialsEmpty")}
                </p>
              )}
            </div>
          )}

          {active === "delivery" && (
            <div className="space-y-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {t("deliveryTitle")}
                </h3>
                <p className="mt-1">{t("deliveryDesc")}</p>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {t("installationTitle")}
                </h3>
                <p className="mt-1">{t("installationDesc")}</p>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {t("warrantyTitle")}
                </h3>
                <p className="mt-1">{t("warrantyDesc")}</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
