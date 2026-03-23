import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductPriceCalculator } from "@/components/products/product-price-calculator";
import { ProductGallery } from "@/components/products/product-gallery";
import { Container } from "@/components/ui/container";
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { isAdminUser } from "@/lib/auth/is-admin";
import { getFormulaComponentsForProduct } from "@/lib/data/formula-queries";
import {
  getPriceFormulaById,
  getPricePresetsForFormula,
  getProductBySlug,
} from "@/lib/data/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

async function canPreviewInactiveProduct() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return false;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return isAdminUser(user);
}

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

  const [formula, presets, components] = await Promise.all([
    product.formula_id ? getPriceFormulaById(product.formula_id) : Promise.resolve(null),
    product.formula_id ? getPricePresetsForFormula(product.formula_id) : Promise.resolve([]),
    product.formula_id ? getFormulaComponentsForProduct(product.formula_id) : Promise.resolve([]),
  ]);

  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <ProductGallery images={galleryImages} title={product.title} />

          <div className="space-y-5 rounded-3xl border border-[var(--color-border)] bg-white p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">
                {PRODUCT_CATEGORY_LABELS[product.category as keyof typeof PRODUCT_CATEGORY_LABELS] ??
                  product.category}
              </span>
              {product.status !== "active" ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  {PRODUCT_STATUS_LABELS[product.status]} · лише для адміна
                </span>
              ) : null}
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
              components={components}
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
  );
}
