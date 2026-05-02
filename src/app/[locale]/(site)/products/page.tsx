import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PackageSearch } from "lucide-react";
import { AttributeLabelsProvider } from "@/components/products/attribute-labels-context";
import { ComparisonBar } from "@/components/products/comparison-bar";
import { ProductCard } from "@/components/products/product-card";
import { ProductFiltersPanel } from "@/components/products/product-filters-panel";
import { ProductsFilterDrawer } from "@/components/products/products-filter-drawer";
import { ProductsGridClient } from "@/components/products/products-grid-client";
import { ProductsPagination } from "@/components/products/products-pagination";
import { ProductsSortSelect } from "@/components/products/products-sort-select";
import { ProductsViewToggle } from "@/components/products/products-view-toggle";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import {
  getAllActiveProducts,
  getProductFilterOptions,
  getProducts,
  parseProductFilters,
} from "@/lib/data/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localizeProduct } from "@/lib/i18n/content";

export const revalidate = 0; // dynamic — wishlist depends on session

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
          <div key={index} className="h-8 w-20 animate-pulse rounded-full bg-[var(--color-border)]" />
        ))}
      </div>
      <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--color-border)]" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-8 w-24 animate-pulse rounded-full bg-[var(--color-border)]" />
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

  // Resolve user + wishlist server-side
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  let wishlistIds: string[] | undefined;
  let wishlistCount: number | null = null; // null = not logged in

  if (user && supabase) {
    const { data: wishlistRows } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", user.id);
    const ids = wishlistRows?.map((r) => r.product_id as string) ?? [];
    wishlistCount = ids.length;

    if (filters.wishlist) {
      wishlistIds = ids;
    }
  }

  const filtersResolved = wishlistIds !== undefined
    ? { ...filters, wishlistIds }
    : filters;

  const localeRaw = await getLocale();
  const locale: "uk" | "en" = localeRaw === "en" ? "en" : "uk";

  const [{ items: rawItems, total }, filterOptions, rawComparisonProducts, t, tCommon, tNav] =
    await Promise.all([
      getProducts(filtersResolved),
      getProductFilterOptions(locale),
      getAllActiveProducts(),
      getTranslations("productsPage"),
      getTranslations("common"),
      getTranslations("nav"),
    ]);

  const items = rawItems.map((p) => localizeProduct(p, locale));
  const comparisonProducts = rawComparisonProducts.map((p) => localizeProduct(p, locale));
  const totalPages = Math.ceil(total / filters.pageSize);

  return (
    <AttributeLabelsProvider
      materials={filterOptions.materialLabelsBySlug}
      styles={filterOptions.styleLabelsBySlug}
    >
      {/* Hero strip */}
      <section className="relative flex h-[280px] items-end overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1920&q=80"
          alt={t("woodAlt")}
          fill
          priority
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(26,10,10,0.92) 40%, rgba(92,26,26,0.60) 100%)" }}
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
            {filters.wishlist ? t("heroTitleWishlist") : t("heroTitle")}
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
              <Suspense fallback={<ProductFiltersFallback />}>
                <ProductFiltersPanel
                  filters={filters}
                  categoryOptions={filterOptions.categories}
                  styleOptions={filterOptions.styles}
                  materialOptions={filterOptions.materials}
                  wishlistCount={wishlistCount}
                />
              </Suspense>
            </div>

            {/* Products area */}
            <div>
              <div className="mb-5 flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">
                  {t("itemsFound", { count: total })}
                </p>
                <div className="flex items-center gap-3">
                  <ProductsSortSelect current={filters.sort} />
                  <ProductsViewToggle current={filters.view} />
                </div>
              </div>

              {items.length > 0 ? (
                <ProductsGridClient view={filters.view}>
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} view={filters.view} />
                  ))}
                </ProductsGridClient>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] py-20">
                  <PackageSearch size={48} className="text-[var(--color-border)]" />
                  <h3 className="mt-4 font-display text-xl font-semibold text-[var(--color-text-primary)]">
                    {filters.wishlist ? t("wishlistEmpty") : t("noResults")}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {filters.wishlist ? t("wishlistEmptyHint") : t("noResultsHint")}
                  </p>
                  <Link
                    href="/products"
                    className="mt-4 rounded-full border border-[var(--color-primary)] px-5 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                  >
                    {filters.wishlist ? t("allProducts") : t("resetFilters")}
                  </Link>
                </div>
              )}

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
          wishlistCount={wishlistCount}
        />
      </Suspense>

      {comparisonProducts.length > 0 ? (
        <ComparisonBar products={comparisonProducts} />
      ) : null}
    </AttributeLabelsProvider>
  );
}
