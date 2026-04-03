import type { MetadataRoute } from "next";
import { getAllProductsForAdmin, getServices } from "@/lib/data/queries";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://svitlytsya.ua";
const locales = ["uk", "en"] as const;

function toMaterialSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, products] = await Promise.all([
    getServices(),
    getAllProductsForAdmin().then((items) => items.filter((product) => product.status === "active")),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/services",
    "/products",
    "/blog",
    "/faq",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
  ].flatMap((route) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
  );

  const productRoutes: MetadataRoute.Sitemap = products.flatMap((product) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/products/${product.slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  const serviceRoutes: MetadataRoute.Sitemap = services.flatMap((service) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/services/${service.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  const seenMaterialRoutes = new Set<string>();
  const materialRoutes: MetadataRoute.Sitemap = [];

  for (const product of products) {
    for (const material of product.materials) {
      const materialSlug = toMaterialSlug(material);
      const route = `/products/${product.category}/${materialSlug}`;
      if (seenMaterialRoutes.has(route)) {
        continue;
      }

      seenMaterialRoutes.add(route);
      for (const locale of locales) {
        materialRoutes.push({
          url: `${baseUrl}/${locale}${route}`,
          lastModified: new Date(product.updated_at),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  }

  return [...staticRoutes, ...productRoutes, ...serviceRoutes, ...materialRoutes];
}
