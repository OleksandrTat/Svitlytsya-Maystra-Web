import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Product3DViewer } from "@/components/products/product-3d-viewer";
import { ProductConfiguratorWrapper } from "@/components/products/product-configurator-wrapper";
import { ProductDetailTabs } from "@/components/products/product-detail-tabs";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductPriceCalculator } from "@/components/products/product-price-calculator";
import { ProductTestimonials } from "@/components/products/product-testimonials";
import { RelatedProducts } from "@/components/products/related-products";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { isAdminUser } from "@/lib/auth/is-admin";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { getFormulaComponentsForProduct } from "@/lib/data/formula-queries";
import {
  getPriceFormulaById,
  getPricePresetsForFormula,
  getProductBySlug,
  getRelatedProducts,
  getRelatedServices,
  getTestimonialsForProduct,
} from "@/lib/data/queries";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

export const revalidate = 3600;

type PageParams = {
  slug: string;
};

function isSupportedImageSrc(value: string | null | undefined) {
  if (!value) return false;
  const src = value.trim();
  return (
    src.startsWith("/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  );
}

async function canPreviewInactiveProduct() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdminUser(user);
}

const GUARANTEES = [
  "Безкоштовна консультація",
  "Виробництво 14–21 день",
  "Гарантія 3 роки",
  "Доставка по Україні",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const canPreview = await canPreviewInactiveProduct();

  if (!product || (product.status !== "active" && !canPreview)) {
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
  const canPreview = await canPreviewInactiveProduct();

  if (!product || (product.status !== "active" && !canPreview)) {
    notFound();
  }

  const baseImages = (product.images.length ? product.images : [product.cover_image]).filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
  const galleryImages = baseImages.filter((item) => isSupportedImageSrc(item));
  if (galleryImages.length === 0) {
    galleryImages.push("/window.svg");
  }

  const categoryLabel =
    PRODUCT_CATEGORY_LABELS[product.category as keyof typeof PRODUCT_CATEGORY_LABELS] ??
    product.category;
  const contactHref = `/contact?${new URLSearchParams({
    product: product.slug,
    service: categoryLabel,
  }).toString()}`;
  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());

  const [formula, presets, components, relatedProducts, relatedServices, testimonials] =
    await Promise.all([
      product.formula_id
        ? getPriceFormulaById(product.formula_id, supabase)
        : Promise.resolve(null),
      product.formula_id
        ? getPricePresetsForFormula(product.formula_id, supabase)
        : Promise.resolve([]),
      product.formula_id
        ? getFormulaComponentsForProduct(product.formula_id, supabase)
        : Promise.resolve([]),
      getRelatedProducts(product.id, product.category, product.style),
      getRelatedServices(product.category),
      getTestimonialsForProduct(product.id),
    ]);

  const linkedTestimonialsCount = testimonials.filter(
    (testimonial) => testimonial.project_id === product.id,
  ).length;
  const model3dUrl = product.model_3d_url?.trim() || null;
  const arPlacement = product.category === "windows" ? "wall" : "floor";

  return (
    <>
      <PageHero
        title={product.title}
        breadcrumbs={[
          { label: "Головна", href: "/" },
          { label: "Продукти", href: "/products" },
          {
            label: categoryLabel,
            href: `/products?category=${encodeURIComponent(product.category)}`,
          },
          { label: product.title },
        ]}
        height="h-[220px]"
      />

      {/* Main split layout */}
      <section className="py-10 md:py-14">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_480px]">
            {/* Left — Gallery */}
            <div className="space-y-6">
              <ProductGallery images={galleryImages} title={product.title} />

              {model3dUrl && (
                <Product3DViewer
                  modelUrl={model3dUrl}
                  productTitle={product.title}
                  arPlacement={arPlacement}
                />
              )}
            </div>

            {/* Right — Info panel (sticky) */}
            <div className="lg:sticky lg:top-24 lg:h-fit">
              <div className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-white p-6">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--color-bg-warm)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                    {categoryLabel}
                  </span>
                  {product.is_featured && (
                    <span className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white">
                      Популярне
                    </span>
                  )}
                  {product.status !== "active" && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      {PRODUCT_STATUS_LABELS[product.status]} · лише для адміна
                    </span>
                  )}
                </div>

                {/* Title + description */}
                <div>
                  <h2 className="font-display text-3xl font-semibold text-[var(--color-text-primary)] md:text-4xl">
                    {product.title}
                  </h2>
                  {product.short_description && (
                    <p className="mt-2 text-[15px] text-[var(--color-text-secondary)]">
                      {product.short_description}
                    </p>
                  )}
                </div>

                <div className="border-t border-[var(--color-border)]" />

                {/* Materials & Styles as pills */}
                {(product.materials.length > 0 || product.style.length > 0) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {product.materials.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                          Матеріали
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {product.materials.map((m) => (
                            <span
                              key={m}
                              className="rounded-full bg-[var(--color-bg-warm)] px-2.5 py-0.5 text-xs text-[var(--color-text-secondary)]"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {product.style.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                          Стилі
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {product.style.map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-[var(--color-bg-warm)] px-2.5 py-0.5 text-xs text-[var(--color-text-secondary)]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-[var(--color-border)]" />

                {/* Price */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    Вартість
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-[var(--color-primary)]">
                    {product.price_from
                      ? `від ${product.price_from.toLocaleString("uk-UA")} грн`
                      : "За запитом"}
                  </p>
                </div>

                {/* Calculator */}
                <ProductPriceCalculator
                  formula={formula}
                  presets={presets}
                  priceFrom={product.price_from}
                  components={components}
                  contactHref={contactHref}
                />

                <div className="border-t border-[var(--color-border)]" />

                {/* CTA buttons */}
                <div className="space-y-3">
                  <Link
                    href={contactHref}
                    className="flex w-full items-center justify-center rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)]"
                  >
                    Замовити індивідуально
                  </Link>
                  <Link
                    href="/contact"
                    className="flex w-full items-center justify-center rounded-full border border-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                  >
                    Отримати консультацію
                  </Link>
                </div>

                <div className="border-t border-[var(--color-border)]" />

                {/* Micro-guarantees */}
                <div className="space-y-2">
                  {GUARANTEES.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Check size={16} className="shrink-0 text-[var(--color-accent)]" />
                      <span className="text-sm text-[var(--color-text-secondary)]">{item}</span>
                    </div>
                  ))}
                </div>

                <ProductConfiguratorWrapper product={product} />
              </div>
            </div>
          </div>

          {/* Tabs section */}
          <div className="mt-12">
            <ProductDetailTabs
              description={product.description}
              materials={product.materials}
            />
          </div>

          {/* Testimonials */}
          <ProductTestimonials
            testimonials={testimonials}
            linkedCount={linkedTestimonialsCount}
          />
        </Container>
      </section>

      <RelatedProducts
        products={relatedProducts}
        services={relatedServices}
        currentCategory={product.category}
      />

      <FinalCtaSection />
    </>
  );
}
