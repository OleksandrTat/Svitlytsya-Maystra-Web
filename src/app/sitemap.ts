import type { MetadataRoute } from "next";
import { getAllProductsForAdmin, getAllPublicProjectSlugs, getServices } from "@/lib/data/queries";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://svitlytsya.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projectSlugs, services, products] = await Promise.all([
    getAllPublicProjectSlugs(),
    getServices(),
    getAllProductsForAdmin().then((items) => items.filter((product) => product.status === "active")),
  ]);

  const supabase = createSupabaseServiceClient();
  const { data: culturalPosts } = supabase
    ? await supabase
        .from("cultural_blog_posts")
        .select("slug")
        .eq("is_published", true)
    : { data: [] };

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/catalog",
    "/services",
    "/products",
    "/blog",
    "/cultural",
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

  const projectRoutes: MetadataRoute.Sitemap = projectSlugs.map((slug) => ({
    url: `${baseUrl}/catalog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const culturalRoutes: MetadataRoute.Sitemap = (culturalPosts ?? []).map((post) => ({
    url: `${baseUrl}/cultural/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes, ...projectRoutes, ...serviceRoutes, ...culturalRoutes];
}
