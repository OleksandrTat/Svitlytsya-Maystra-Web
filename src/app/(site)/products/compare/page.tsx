import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

type SearchParams = {
  ids?: string;
};

export default async function CompareProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const ids = (params.ids ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (ids.length < 2) {
    notFound();
  }

  const supabase = createSupabaseServiceClient() ?? (await createSupabaseServerClient());
  if (!supabase) {
    notFound();
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", ids)
    .eq("status", "active");

  if (error || !data || data.length < 2) {
    notFound();
  }

  const productMap = new Map((data as Product[]).map((product) => [product.id, product]));
  const products = ids
    .map((id) => productMap.get(id))
    .filter((product): product is Product => Boolean(product));

  if (products.length < 2) {
    notFound();
  }

  const specs = ["category", "materials", "style", "price_from"] as const;
  const specLabels: Record<(typeof specs)[number], string> = {
    category: "Категорія",
    materials: "Матеріали",
    style: "Стиль",
    price_from: "Ціна від",
  };

  return (
    <section className="py-14 md:py-20">
      <Container>
        <Breadcrumbs
          className="mb-6"
          items={[
            { label: "Головна", href: "/" },
            { label: "Продукти", href: "/products" },
            { label: "Порівняння" },
          ]}
        />

        <h1 className="font-display text-3xl text-[var(--color-text-primary)]">
          Порівняння продуктів
        </h1>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="w-40 px-4 py-3 text-left text-sm text-[var(--color-text-secondary)]">
                  Характеристика
                </th>
                {products.map((product) => (
                  <th key={product.id} className="px-4 py-3 text-left align-top">
                    <Link href={`/products/${product.slug}`}>
                      {product.cover_image ? (
                        <div className="relative mb-2 h-32 overflow-hidden rounded-xl">
                          <Image
                            src={product.cover_image}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="240px"
                          />
                        </div>
                      ) : null}
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {product.title}
                      </p>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specs.map((spec) => (
                <tr key={spec} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                    {specLabels[spec]}
                  </td>
                  {products.map((product) => {
                    const rawValue = product[spec];
                    const display = Array.isArray(rawValue)
                      ? rawValue.join(", ") || "—"
                      : spec === "category"
                        ? PRODUCT_CATEGORY_LABELS[
                            rawValue as keyof typeof PRODUCT_CATEGORY_LABELS
                          ] ?? String(rawValue ?? "—")
                        : spec === "price_from"
                          ? rawValue
                            ? `від ${Number(rawValue).toLocaleString("uk-UA")} грн`
                            : "За запитом"
                          : String(rawValue ?? "—");

                    return (
                      <td
                        key={`${product.id}-${spec}`}
                        className="px-4 py-3 text-sm text-[var(--color-text-primary)]"
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t border-[var(--color-border)]">
                <td className="px-4 py-3" />
                {products.map((product) => (
                  <td key={`${product.id}-cta`} className="px-4 py-3">
                    <Link
                      href={`/contact?product=${product.slug}`}
                      className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white"
                    >
                      Замовити
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
