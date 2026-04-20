"use client";

import { useEffect } from "react";
import { posthog } from "@/lib/posthog/client";

/**
 * Fires a product_viewed event on mount. Placed in the product detail page
 * (server component) as a lightweight client island.
 */
export function ProductViewTracker({
  productId,
  title,
  category,
  price,
}: {
  productId: string;
  title: string;
  category?: string;
  price?: number | null;
}) {
  useEffect(() => {
    try {
      posthog.capture("product_viewed", {
        product_id: productId,
        title,
        ...(category ? { category } : {}),
        ...(price != null ? { price } : {}),
      });
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
