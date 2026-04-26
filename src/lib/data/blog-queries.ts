import { cache } from "react";
import { createSupabaseServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { BlogPost, BlogFilters } from "@/lib/types";

// ── Helper ─────────────────────────────────────────────────

async function getSupabase() {
  return createSupabaseServiceClient() ?? (await createSupabaseServerClient());
}

// ── PUBLIC QUERIES ─────────────────────────────────────────

export const getPublishedBlogPosts = cache(
  async (filters: BlogFilters): Promise<{ items: BlogPost[]; total: number }> => {
    const supabase = await getSupabase();
    if (!supabase) return { items: [], total: 0 };

    let query = supabase
      .from("blog_posts")
      .select(
        "id,title,title_en,slug,excerpt,excerpt_en,cover_image,category,tags,reading_time_min,published_at,author_name,author_avatar,is_featured,views_count,likes_count",
        { count: "exact" },
      )
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (filters.category) query = query.eq("category", filters.category);
    if (filters.tag) query = query.contains("tags", [filters.tag]);

    const start = (filters.page - 1) * filters.pageSize;
    const { data, count, error } = await query.range(start, start + filters.pageSize - 1);

    if (error || !data) return { items: [], total: 0 };
    return { items: data as BlogPost[], total: count ?? 0 };
  },
);

export const getFeaturedBlogPosts = cache(async (limit = 3): Promise<BlogPost[]> => {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("blog_posts")
    .select(
      "id,title,title_en,slug,excerpt,excerpt_en,cover_image,category,tags,reading_time_min,published_at,author_name,author_avatar,is_featured,views_count,likes_count",
    )
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as BlogPost[];
});

export const getBlogPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const supabase = await getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as BlogPost;
});

export const getRelatedBlogPosts = cache(
  async (slug: string, category: string, tags: string[]): Promise<BlogPost[]> => {
    const supabase = await getSupabase();
    if (!supabase) return [];

    // Implemented in TS (rather than the get_related_blog_posts RPC)
    // because the RPC's RETURNS TABLE shape only has UK columns; we need
    // title_en / excerpt_en for proper localization on the post page.
    const safeTags = Array.isArray(tags) ? tags.filter(Boolean) : [];

    const filters: string[] = [];
    if (category) filters.push(`category.eq.${category}`);
    if (safeTags.length) filters.push(`tags.ov.{${safeTags.map((t) => `"${t.replace(/"/g, "\\\"")}"`).join(",")}}`);

    let query = supabase
      .from("blog_posts")
      .select(
        "id,title,title_en,slug,excerpt,excerpt_en,cover_image,category,tags,reading_time_min,published_at,author_name,author_avatar,is_featured,views_count,likes_count",
      )
      .eq("is_published", true)
      .neq("slug", slug);

    if (filters.length) {
      query = query.or(filters.join(","));
    }

    const { data } = await query
      .order("published_at", { ascending: false })
      .limit(12);

    const rows = (data ?? []) as BlogPost[];

    const score = (post: BlogPost) => {
      const categoryMatch = post.category === category ? 1 : 0;
      const overlap = safeTags.length
        ? (post.tags ?? []).filter((tag) => safeTags.includes(tag)).length
        : 0;
      return categoryMatch + overlap;
    };

    return rows
      .map((post) => ({ post, s: score(post) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map((entry) => entry.post);
  },
);

export const getBlogCategories = cache(
  async (): Promise<{ category: string; count: number }[]> => {
    const supabase = await getSupabase();
    if (!supabase) return [];

    const { data } = await supabase
      .from("blog_posts")
      .select("category")
      .eq("is_published", true);

    if (!data) return [];

    const counts = data.reduce<Record<string, number>>((acc, row) => {
      acc[row.category] = (acc[row.category] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([category, count]) => ({ category, count }));
  },
);

export const getAllBlogTags = cache(async (): Promise<string[]> => {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("blog_posts")
    .select("tags")
    .eq("is_published", true);

  if (!data) return [];

  const allTags = data.flatMap((row) => row.tags ?? []);
  return [...new Set(allTags)].sort();
});

export async function incrementBlogPostViews(slug: string): Promise<void> {
  const supabase = await getSupabase();
  if (!supabase) return;
  await supabase.rpc("increment_blog_post_views", { post_slug: slug });
}

// ── ADMIN QUERIES ──────────────────────────────────────────

export async function getAllBlogPostsForAdmin(): Promise<BlogPost[]> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("updated_at", { ascending: false });

  return (data ?? []) as BlogPost[];
}

export async function getBlogPostByIdForAdmin(id: string): Promise<BlogPost | null> {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as BlogPost;
}
