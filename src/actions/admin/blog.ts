"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sanitizeHtmlContent } from "@/lib/security/sanitize";

type ActionResult = {
  ok: boolean;
  message: string;
};

type DbErrorLike = {
  code?: string;
  message: string;
};

function parseTags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function calculateReadingTimeMinutes(content: string) {
  const words = stripHtml(content)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 200));
}

function parseCheckbox(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function mapDbError(error: DbErrorLike) {
  if (error.code === "23505") {
    return "Слаг вже зайнятий. Оберіть інший slug для статті.";
  }

  return error.message;
}

export async function createBlogPostAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const title = String(formData.get("title") || "").trim();
  const slug = normalizeSlug(String(formData.get("slug") || ""));
  const excerpt = String(formData.get("excerpt") || "").trim();
  const content = sanitizeHtmlContent(String(formData.get("content") || "").trim());
  const coverImage = String(formData.get("cover_image") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const tags = parseTags(String(formData.get("tags") || ""));
  const authorName = String(formData.get("author_name") || "").trim() || "Команда Світлиці";
  const authorAvatar = String(formData.get("author_avatar") || "").trim();
  const seoTitle = String(formData.get("seo_title") || "").trim();
  const seoDescription = String(formData.get("seo_description") || "").trim();
  const isPublished = parseCheckbox(formData.get("is_published"));
  const isFeatured = parseCheckbox(formData.get("is_featured"));
  const relatedServiceId = String(formData.get("related_service_id") || "").trim();
  const relatedProductId = String(formData.get("related_product_id") || "").trim();

  if (!title || !slug || !excerpt || !content || !category) {
    return { ok: false, message: "Заповніть всі обов'язкові поля статті." };
  }

  const { data: existingBySlug } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingBySlug) {
    return { ok: false, message: "Слаг вже зайнятий. Оберіть інший slug для статті." };
  }

  const { error } = await supabase.from("blog_posts").insert({
    id: randomUUID(),
    title,
    slug,
    excerpt,
    content,
    cover_image: coverImage || null,
    category,
    tags,
    author_name: authorName,
    author_avatar: authorAvatar || null,
    reading_time_min: calculateReadingTimeMinutes(content),
    is_published: isPublished,
    is_featured: isFeatured,
    published_at: isPublished ? new Date().toISOString() : null,
    related_service_id: relatedServiceId || null,
    related_product_id: relatedProductId || null,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
  });

  if (error) {
    return { ok: false, message: mapDbError(error) };
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");

  return { ok: true, message: "Статтю створено." };
}

export async function updateBlogPostAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const slug = normalizeSlug(String(formData.get("slug") || ""));
  const excerpt = String(formData.get("excerpt") || "").trim();
  const content = sanitizeHtmlContent(String(formData.get("content") || "").trim());
  const coverImage = String(formData.get("cover_image") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const tags = parseTags(String(formData.get("tags") || ""));
  const providedAuthorName = String(formData.get("author_name") || "").trim();
  const providedAuthorAvatar = String(formData.get("author_avatar") || "").trim();
  const seoTitle = String(formData.get("seo_title") || "").trim();
  const seoDescription = String(formData.get("seo_description") || "").trim();
  const isPublished = parseCheckbox(formData.get("is_published"));
  const hasFeaturedField = formData.has("is_featured");
  const isFeatured = parseCheckbox(formData.get("is_featured"));
  const relatedServiceId = String(formData.get("related_service_id") || "").trim();
  const relatedProductId = String(formData.get("related_product_id") || "").trim();

  if (!id || !title || !slug || !excerpt || !content || !category) {
    return { ok: false, message: "Заповніть всі обов'язкові поля статті." };
  }

  const { data: existingSlugPost } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();

  if (existingSlugPost) {
    return { ok: false, message: "Слаг вже зайнятий. Оберіть інший slug для статті." };
  }

  const { data: existing } = await supabase
    .from("blog_posts")
    .select("slug,published_at,author_name,author_avatar,is_featured,related_service_id,related_product_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("blog_posts")
    .update({
      title,
      slug,
      excerpt,
      content,
      cover_image: coverImage || null,
      category,
      tags,
      author_name: formData.has("author_name")
        ? providedAuthorName || "Команда Світлиці"
        : existing?.author_name ?? "Команда Світлиці",
      author_avatar: formData.has("author_avatar")
        ? providedAuthorAvatar || null
        : existing?.author_avatar ?? null,
      reading_time_min: calculateReadingTimeMinutes(content),
      is_published: isPublished,
      is_featured: hasFeaturedField ? isFeatured : existing?.is_featured ?? false,
      published_at: isPublished ? existing?.published_at ?? new Date().toISOString() : null,
      related_service_id: formData.has("related_service_id")
        ? relatedServiceId || null
        : existing?.related_service_id ?? null,
      related_product_id: formData.has("related_product_id")
        ? relatedProductId || null
        : existing?.related_product_id ?? null,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: mapDbError(error) };
  }

  revalidatePath("/blog");
  if (existing?.slug) {
    revalidatePath(`/blog/${existing.slug}`);
  }
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");

  return { ok: true, message: "Статтю оновлено." };
}

export async function deleteBlogPostAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const id = String(formData.get("id") || "");
  if (!id) {
    return { ok: false, message: "Post ID is required." };
  }

  const { data: row } = await supabase.from("blog_posts").select("slug").eq("id", id).maybeSingle();

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/blog");
  if (row?.slug) {
    revalidatePath(`/blog/${row.slug}`);
  }
  revalidatePath("/admin/blog");

  return { ok: true, message: "Статтю видалено." };
}

export async function togglePublishBlogPostAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const id = String(formData.get("id") || "");
  const publish = parseCheckbox(formData.get("publish"));

  if (!id) {
    return { ok: false, message: "Post ID is required." };
  }

  const { data: row } = await supabase
    .from("blog_posts")
    .select("slug,published_at")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("blog_posts")
    .update({
      is_published: publish,
      published_at: publish ? row?.published_at ?? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/blog");
  if (row?.slug) {
    revalidatePath(`/blog/${row.slug}`);
  }
  revalidatePath("/admin/blog");

  return { ok: true, message: publish ? "Статтю опубліковано." : "Статтю переведено в чернетку." };
}
export async function toggleFeaturedBlogPostAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const id = String(formData.get("id") || "");
  const featured = parseCheckbox(formData.get("featured"));

  if (!id) {
    return { ok: false, message: "Post ID is required." };
  }

  const { data: row } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("blog_posts")
    .update({ is_featured: featured })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/blog");
  if (row?.slug) {
    revalidatePath(`/blog/${row.slug}`);
  }
  revalidatePath("/admin/blog");

  return {
    ok: true,
    message: featured ? "РЎС‚Р°С‚С‚СЋ РІРёРґС–Р»РµРЅРѕ." : "РЎС‚Р°С‚С‚СЋ РїСЂРёР±СЂР°РЅРѕ Р· РІРёРґС–Р»РµРЅРёС….",
  };
}
