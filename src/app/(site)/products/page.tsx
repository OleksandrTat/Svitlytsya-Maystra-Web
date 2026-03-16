import type { Metadata } from "next";
import { ProductCard } from "@/components/products/product-card";
import { ProductFiltersPanel } from "@/components/products/product-filters-panel";
import { SimilarProductsSearch } from "@/components/products/similar-products-search";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProducts, parseProductFilters } from "@/lib/data/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Продукти",
  description: "Каталог продуктів майстерні: двері, меблі, вікна.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseProductFilters(params);
  const { items } = await getProducts(filters);

  return (
    <section className="py-14 md:py-20">
      <Container>
        <SectionHeading
          eyebrow="Продукти"
          title="Наш асортимент"
          description="Оберіть продукт та отримайте індивідуальний розрахунок вартості."
        />
        <div className="mt-8">
          <SimilarProductsSearch />
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
          <ProductFiltersPanel filters={filters} />
          <div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {items.length === 0 && (
              <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-secondary)]">
                За обраними фільтрами продуктів не знайдено.
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
