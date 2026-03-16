import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectCard } from "@/components/catalog/project-card";
import { ProjectGallery } from "@/components/catalog/project-gallery";
import { ProductPriceCalculator } from "@/components/products/product-price-calculator";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import {
  getPriceFormulaById,
  getPricePresetsForFormula,
  getProductBySlug,
  getProjectsForProduct,
} from "@/lib/data/queries";

export const revalidate = 3600;

type PageParams = {
  slug: string;
};

function isSupportedImageSrc(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const src = value.trim();
  return (
    src.startsWith("/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || product.status !== "active") {
    return { title: "Продукт не знайдено" };
  }

  const title = product.seo_title?.trim() || product.title;
  const description =
    product.seo_description?.trim() ||
    product.short_description ||
    product.description.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.cover_image ? [{ url: product.cover_image }] : [],
      type: "article",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || product.status !== "active") {
    notFound();
  }

  const baseImages = (product.images.length ? product.images : [product.cover_image]).filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
  const galleryImages = baseImages.filter((item) => isSupportedImageSrc(item));
  if (galleryImages.length === 0) {
    galleryImages.push("/window.svg");
  }

  const [projects, formula, presets] = await Promise.all([
    getProjectsForProduct(product.id),
    product.formula_id ? getPriceFormulaById(product.formula_id) : Promise.resolve(null),
    product.formula_id ? getPricePresetsForFormula(product.formula_id) : Promise.resolve([]),
  ]);

  return (
    <>
      <section className="py-14 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <ProjectGallery images={galleryImages} title={product.title} />

            <div className="space-y-5 rounded-3xl border border-[var(--color-border)] bg-white p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">
                  {PRODUCT_CATEGORY_LABELS[product.category as keyof typeof PRODUCT_CATEGORY_LABELS] ??
                    product.category}
                </span>
              </div>

              <div>
                <h1 className="font-display text-3xl text-[var(--color-text-primary)] md:text-4xl">
                  {product.title}
                </h1>
                {product.short_description && (
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    {product.short_description}
                  </p>
                )}
                <p className="mt-3 text-[var(--color-text-secondary)]">{product.description}</p>
              </div>

              {(product.materials.length > 0 || product.style.length > 0) && (
                <div className="grid gap-4 text-sm text-[var(--color-text-secondary)] sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-primary)]">
                      Матеріали
                    </p>
                    <p className="mt-2">
                      {product.materials.length > 0 ? product.materials.join(", ") : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-primary)]">
                      Стилі
                    </p>
                    <p className="mt-2">{product.style.length > 0 ? product.style.join(", ") : "-"}</p>
                  </div>
                </div>
              )}

              <ProductPriceCalculator
                formula={formula}
                presets={presets}
                priceFrom={product.price_from}
              />

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white"
                >
                  Замовити
                </Link>
                <Link
                  href="/products"
                  className="rounded-full border border-[var(--color-border)] px-6 py-3 text-sm text-[var(--color-text-secondary)]"
                >
                  Повернутись до каталогу
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {projects.length > 0 ? (
        <section className="pb-14 md:pb-20">
          <Container>
            <SectionHeading title="Проєкти з цим продуктом" />
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
