import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/products/product-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { getAllActiveProducts } from "@/lib/data/queries";

type PageParams = {
  slug: string;
  material: string;
};

function toMaterialSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function fromMaterialSlug(value: string) {
  return value.replace(/-/g, " ").trim();
}

export async function generateStaticParams(): Promise<PageParams[]> {
  const products = await getAllActiveProducts();
  const seen = new Set<string>();
  const params: PageParams[] = [];

  for (const product of products) {
    for (const material of product.materials) {
      const materialSlug = toMaterialSlug(material);
      const key = `${product.category}::${materialSlug}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      params.push({
        slug: product.category,
        material: materialSlug,
      });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug, material } = await params;
  const category = slug;
  const categoryLabel =
    PRODUCT_CATEGORY_LABELS[category as keyof typeof PRODUCT_CATEGORY_LABELS] ?? category;
  const materialLabel = fromMaterialSlug(toMaterialSlug(material));

  return {
    title: `${categoryLabel} з ${materialLabel} | Svitlytsya Maystra`,
    description: `Каталог ${categoryLabel.toLowerCase()} з ${materialLabel} на замовлення. Індивідуальний підхід, 26+ років досвіду. Розрахунок безкоштовно.`,
  };
}

export const revalidate = 86400;

export default async function ProductsByCategoryMaterialPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug, material } = await params;
  const category = slug;
  const normalizedMaterial = toMaterialSlug(material);
  const materialLabel = fromMaterialSlug(normalizedMaterial);
  const categoryLabel =
    PRODUCT_CATEGORY_LABELS[category as keyof typeof PRODUCT_CATEGORY_LABELS] ?? category;
  const products = (await getAllActiveProducts()).filter(
    (product) =>
      product.category === category &&
      product.materials.some((item) => toMaterialSlug(item) === normalizedMaterial),
  );

  if (products.length === 0) {
    notFound();
  }

  return (
    <section className="py-14 md:py-20">
      <Container>
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: "Головна", href: "/" },
            { label: "Продукти", href: "/products" },
            { label: categoryLabel, href: `/products?category=${encodeURIComponent(category)}` },
            { label: materialLabel },
          ]}
        />

        <SectionHeading
          eyebrow={categoryLabel}
          title={`${categoryLabel} з ${materialLabel}`}
          description={`${products.length} варіантів на замовлення. Кожен виріб індивідуальний — розрахунок після консультації.`}
        />

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <h2 className="font-display text-xl text-[var(--color-text-primary)]">
            {categoryLabel} з {materialLabel} на замовлення
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
            Майстерня Svitlytsya Maystra виготовляє {categoryLabel.toLowerCase()} з{" "}
            {materialLabel} за індивідуальними розмірами та проєктами. 26+ років досвіду,
            власне виробництво, гарантія 3 роки. Кожне замовлення починається з безкоштовної
            консультації.
          </p>
          <Link
            href={`/contact?service=${encodeURIComponent(categoryLabel)}`}
            className="mt-4 inline-block rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white"
          >
            Отримати розрахунок
          </Link>
        </div>
      </Container>
    </section>
  );
}
