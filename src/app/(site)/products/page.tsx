import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import { ComparisonBar } from "@/components/products/comparison-bar";
import { ProductCard } from "@/components/products/product-card";
import { ProductFiltersPanel } from "@/components/products/product-filters-panel";
import { ProductsFilterDrawer } from "@/components/products/products-filter-drawer";
import { ProductsGridClient } from "@/components/products/products-grid-client";
import { ProductsPagination } from "@/components/products/products-pagination";
import { ProductsSortSelect } from "@/components/products/products-sort-select";
import { ProductsViewToggle } from "@/components/products/products-view-toggle";
import { SimilarProductsSearch } from "@/components/products/similar-products-search";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import {
  getAllActiveProducts,
  getProductFilterOptions,
  getProducts,
  parseProductFilters,
} from "@/lib/data/queries";
import { hasOpenAi } from "@/lib/env";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Каталог виробів",
  description:
    "Каталог продуктів майстерні: двері, меблі та вікна на замовлення. Кожен виріб виготовляється індивідуально.",
};

function ProductFiltersFallback() {
  return (
    <aside className="hidden space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-warm)] p-6 lg:block">
      <div className="h-8 w-full animate-pulse rounded-lg bg-[var(--color-border)]" />
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
    <>
      {/* Hero strip */}
      <section className="relative flex h-[280px] items-end overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1920&q=80"
          alt="Деревина"
          fill
          priority
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(26,10,10,0.92) 40%, rgba(92,26,26,0.60) 100%)",
          }}
        />
        <Container className="relative z-10 pb-10">
          <Breadcrumbs
            items={[
              { label: "Головна", href: "/" },
              { label: "Продукти" },
            ]}
            className="text-white/60 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white/80"
          />
          <h1 className="mt-3 font-display text-4xl font-bold text-white md:text-5xl">
            Каталог виробів
          </h1>
          <p className="mt-2 max-w-xl text-base text-white/75">
            Авторські двері, меблі та вікна — кожен виріб виготовляється індивідуально
          </p>
          <p className="mt-2 text-sm text-white/50">
            {total} {total === 1 ? "виріб" : total < 5 ? "вироби" : "виробів"} знайдено
          </p>
        </Container>
      </section>

      {/* Main content */}
      <section className="py-10 pb-24 md:py-14 md:pb-28">
        <Container>
          {hasOpenAi ? (
            <div className="mb-8">
              <SimilarProductsSearch />
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Sidebar filters */}
            <Suspense fallback={<ProductFiltersFallback />}>
              <ProductFiltersPanel
                filters={filters}
                categoryOptions={filterOptions.categories}
                styleOptions={filterOptions.styles}
                materialOptions={filterOptions.materials}
              />
            </Suspense>

            {/* Products area */}
            <div>
              {/* Top bar */}
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">
                  Знайдено: {total}{" "}
                  {total === 1 ? "виріб" : total < 5 ? "вироби" : "виробів"}
                </p>
                <div className="flex items-center gap-3">
                  <ProductsSortSelect current={filters.sort} />
                  <ProductsViewToggle current={filters.view} />
                </div>
              </div>

              {/* Product grid */}
              {items.length > 0 ? (
                <ProductsGridClient view={filters.view}>
                  {items.map((product, i) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </ProductsGridClient>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] py-20">
                  <PackageSearch
                    size={48}
                    className="text-[var(--color-border)]"
                  />
                  <h3 className="mt-4 font-display text-xl font-semibold text-[var(--color-text-primary)]">
                    Нічого не знайдено
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    Спробуйте змінити фільтри або переглянути всі вироби
                  </p>
                  <Link
                    href="/products"
                    className="mt-4 rounded-full border border-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                  >
                    Скинути фільтри
                  </Link>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <ProductsPagination
                    currentPage={filters.page}
                    totalPages={totalPages}
                  />
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Mobile filter drawer */}
      <Suspense fallback={null}>
        <ProductsFilterDrawer
          filters={filters}
          categoryOptions={filterOptions.categories}
          styleOptions={filterOptions.styles}
          materialOptions={filterOptions.materials}
        />
      </Suspense>

      {comparisonProducts.length > 0 ? (
        <ComparisonBar products={comparisonProducts} />
      ) : null}
    </>
  );
}
