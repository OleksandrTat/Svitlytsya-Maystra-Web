import type { Metadata } from "next";
import { Suspense } from "react";
import { ComparisonBar } from "@/components/products/comparison-bar";
import { ProductCard } from "@/components/products/product-card";
import { ProductFiltersPanel } from "@/components/products/product-filters-panel";
import { ProductsPagination } from "@/components/products/products-pagination";
import { ProductsSortSelect } from "@/components/products/products-sort-select";
import { SimilarProductsSearch } from "@/components/products/similar-products-search";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  getAllActiveProducts,
  getProductFilterOptions,
  getProducts,
  parseProductFilters,
} from "@/lib/data/queries";
import { hasOpenAi } from "@/lib/env";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Продукти",
  description: "Каталог продуктів майстерні: двері, меблі та вікна на замовлення.",
};

function ProductFiltersFallback() {
  return (
    <aside className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="h-5 w-24 animate-pulse rounded-full bg-[var(--color-border)]" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-8 w-20 animate-pulse rounded-full bg-[var(--color-border)]"
          />
        ))}
      </div>
      <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--color-border)]" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-8 w-24 animate-pulse rounded-full bg-[var(--color-border)]"
          />
        ))}
      </div>
    </aside>
  );
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseProductFilters(params);
  const [{ items, total }, filterOptions, comparisonProducts] = await Promise.all([
    getProducts(filters),
    getProductFilterOptions(),
    getAllActiveProducts(),
  ]);
  const totalPages = Math.ceil(total / filters.pageSize);

  return (
    <section className="py-14 pb-24 md:py-20 md:pb-28">
      <Container>
        <SectionHeading
          eyebrow="Продукти"
          title="Наш асортимент"
          description="Оберіть продукт та отримайте індивідуальний розрахунок вартості."
        />

        {hasOpenAi ? (
          <div className="mt-8">
            <SimilarProductsSearch />
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
          <Suspense fallback={<ProductFiltersFallback />}>
            <ProductFiltersPanel
              filters={filters}
              categoryOptions={filterOptions.categories}
              styleOptions={filterOptions.styles}
              materialOptions={filterOptions.materials}
            />
          </Suspense>

          <div>
            <div className="mb-5 flex justify-end">
              <ProductsSortSelect current={filters.sort} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-secondary)]">
                За обраними фільтрами продуктів не знайдено.
              </p>
            ) : null}

            <div className="mt-8 space-y-4">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Знайдено {total} продуктів
              </p>
              {totalPages > 1 ? (
                <ProductsPagination currentPage={filters.page} totalPages={totalPages} />
              ) : null}
            </div>
          </div>
        </div>
      </Container>

      {comparisonProducts.length > 0 ? <ComparisonBar products={comparisonProducts} /> : null}
    </section>
  );
}
