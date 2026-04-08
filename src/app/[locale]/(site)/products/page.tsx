import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
import { localizeProduct } from "@/lib/i18n/content";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("productsPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

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
  const [{ items: rawItems, total }, filterOptions, rawComparisonProducts, locale, t, tCommon, tNav] = await Promise.all([
    getProducts(filters),
    getProductFilterOptions(),
    getAllActiveProducts(),
    getLocale(),
    getTranslations("productsPage"),
    getTranslations("common"),
    getTranslations("nav"),
  ]);
  const items = rawItems.map((p) => localizeProduct(p, locale as "uk" | "en"));
  const comparisonProducts = rawComparisonProducts.map((p) => localizeProduct(p, locale as "uk" | "en"));
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
              { label: tCommon("home"), href: "/" },
              { label: tNav("products") },
            ]}
            className="text-white/60 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white/80"
          />
          <h1 className="mt-3 font-display text-4xl font-bold text-white md:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-2 max-w-xl text-base text-white/75">
            {t("heroSubtitle")}
          </p>
          <p className="mt-2 text-sm text-white/50">
            {t("itemsFound", { count: total })}
          </p>
        </Container>
      </section>

      {/* Main content */}
      <section className="py-10 pb-24 md:py-14 md:pb-28">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Sidebar filters */}
            <div className="space-y-4">
              {hasOpenAi ? <SimilarProductsSearch /> : null}
              <Suspense fallback={<ProductFiltersFallback />}>
                <ProductFiltersPanel
                  filters={filters}
                  categoryOptions={filterOptions.categories}
                  styleOptions={filterOptions.styles}
                  materialOptions={filterOptions.materials}
                />
              </Suspense>
            </div>

            {/* Products area */}
            <div>
              {/* Top bar */}
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">
                  {t("itemsFound", { count: total })}
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
                    {t("noResults")}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {t("noResultsHint")}
                  </p>
                  <Link
                    href="/products"
                    className="mt-4 rounded-full border border-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                  >
                    {t("resetFilters")}
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
