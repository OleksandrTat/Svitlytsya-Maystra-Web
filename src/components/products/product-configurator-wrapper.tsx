"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveConfigurationAction } from "@/actions/configurations";
import { PRODUCT_CATEGORY_TO_PRODUCT_TYPE } from "@/lib/constants";
import type { Product } from "@/lib/types";
import { ConfiguratorSummary } from "./configurator-summary";
import { CONFIGURATOR_STEPS, ProductConfigurator } from "./product-configurator";

const SESSION_STORAGE_KEY = "product_configurator_session";

function getOrCreateSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const nextId = window.crypto.randomUUID();
    window.localStorage.setItem(SESSION_STORAGE_KEY, nextId);
    return nextId;
  } catch {
    return null;
  }
}

type ConfigurableProduct = Pick<Product, "slug" | "title" | "category" | "price_from">;

export function ProductConfiguratorWrapper({ product }: { product: ConfigurableProduct }) {
  const [config, setConfig] = useState<Record<string, string> | null>(null);
  const [savedConfigurationId, setSavedConfigurationId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const steps = useMemo(() => CONFIGURATOR_STEPS[product.category] ?? [], [product.category]);

  if (steps.length === 0) {
    return null;
  }

  if (config) {
    return (
      <ConfiguratorSummary
        productSlug={product.slug}
        productTitle={product.title}
        productCategory={product.category}
        config={config}
        steps={steps}
        savedConfigurationId={savedConfigurationId}
        onEdit={() => setConfig(null)}
      />
    );
  }

  return (
    <ProductConfigurator
      productSlug={product.slug}
      productTitle={product.title}
      category={product.category}
      priceFrom={product.price_from}
      steps={steps}
      onComplete={(nextConfig) => {
        setConfig(nextConfig);

        const productType =
          PRODUCT_CATEGORY_TO_PRODUCT_TYPE[
            product.category as keyof typeof PRODUCT_CATEGORY_TO_PRODUCT_TYPE
          ];

        if (!productType) {
          return;
        }

        startTransition(async () => {
          const sessionId = getOrCreateSessionId() ?? undefined;
          const result = await saveConfigurationAction({
            productType,
            configuration: {
              product_slug: product.slug,
              product_title: product.title,
              product_category: product.category,
              selections: nextConfig,
            },
            sessionId,
            name: `${product.title} configuration`,
          });

          if (result.ok) {
            setSavedConfigurationId(result.id);
          } else {
            toast.error("Не вдалося зберегти конфігурацію, але ви можете продовжити заявку.");
          }
        });
      }}
    />
  );
}
