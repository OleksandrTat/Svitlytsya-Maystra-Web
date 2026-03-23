import type { MetadataRoute } from "next";
import { getAllProductsForAdmin, getServices } from "@/lib/data/queries";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://svitlytsya.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, products] = await Promise.all([
    getServices(),
    getAllProductsForAdmin().then((items) => items.filter((product) => product.status === "active")),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/services",
    "/products",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...serviceRoutes];
}
