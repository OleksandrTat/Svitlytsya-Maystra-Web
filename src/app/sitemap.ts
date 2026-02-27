import type { MetadataRoute } from "next";
import { getAllPublicProjectSlugs, getServices } from "@/lib/data/queries";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://svitlytsya.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projectSlugs, services] = await Promise.all([
    getAllPublicProjectSlugs(),
    getServices(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/catalog",
    "/services",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projectSlugs.map((slug) => ({
    url: `${baseUrl}/catalog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...projectRoutes, ...serviceRoutes];
}
