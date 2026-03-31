"use client";

import { ProductCard } from "@/components/products/product-card";
import type { Product } from "@/lib/types";

export function WishlistGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
