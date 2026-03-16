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
    return "Слаг вже зайнятий. Оберіть інший slug для культурної статті.";
  }

  return error.message;
}

export async function createCulturalPostAction(formData: FormData): Promise<ActionResult> {
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
  const category = String(formData.get("category") || "").trim() || "culture";
  const tags = parseTags(String(formData.get("tags") || ""));
  const seoTitle = String(formData.get("seo_title") || "").trim();
  const seoDescription = String(formData.get("seo_description") || "").trim();
  const guestAuthorName = String(formData.get("guest_author_name") || "").trim();
  const guestAuthorBio = String(formData.get("guest_author_bio") || "").trim();
  const isPublished = parseCheckbox(formData.get("is_published"));
  const allowComments = parseCheckbox(formData.get("allow_comments"));

  if (!title || !slug || !excerpt || !content) {
    return { ok: false, message: "Заповніть всі обов'язкові поля статті." };
  }

  const { data: existingBySlug } = await supabase
    .from("cultural_blog_posts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existingBySlug) {
    return { ok: false, message: "Слаг вже зайнятий. Оберіть інший slug для культурної статті." };
  }

  const { error } = await supabase.from("cultural_blog_posts").insert({
    id: randomUUID(),
    title,
    slug,
    excerpt,
    content,
    cover_image: coverImage || null,
    category,
    tags,
    reading_time_min: calculateReadingTimeMinutes(content),
    is_published: isPublished,
    published_at: isPublished ? new Date().toISOString() : null,
    seo_title: seoTitle || null,
    seo_description: seoDescription || null,
    guest_author_name: guestAuthorName || null,
    guest_author_bio: guestAuthorBio || null,
    allow_comments: allowComments,
  });

  if (error) {
    return { ok: false, message: mapDbError(error) };
  }

  revalidatePath("/cultural");
  revalidatePath(`/cultural/${slug}`);
  revalidatePath("/admin/cultural");

  return { ok: true, message: "Культурну статтю створено." };
}

export async function updateCulturalPostAction(formData: FormData): Promise<ActionResult> {
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
  const category = String(formData.get("category") || "").trim() || "culture";
  const tags = parseTags(String(formData.get("tags") || ""));
  const seoTitle = String(formData.get("seo_title") || "").trim();
  const seoDescription = String(formData.get("seo_description") || "").trim();
  const guestAuthorName = String(formData.get("guest_author_name") || "").trim();
  const guestAuthorBio = String(formData.get("guest_author_bio") || "").trim();
  const isPublished = parseCheckbox(formData.get("is_published"));
  const allowComments = parseCheckbox(formData.get("allow_comments"));

  if (!id || !title || !slug || !excerpt || !content) {
    return { ok: false, message: "Заповніть всі обов'язкові поля статті." };
  }

  const { data: existingSlugPost } = await supabase
    .from("cultural_blog_posts")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle();

  if (existingSlugPost) {
    return { ok: false, message: "Слаг вже зайнятий. Оберіть інший slug для культурної статті." };
  }

  const { data: existing } = await supabase
    .from("cultural_blog_posts")
    .select("slug,published_at")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("cultural_blog_posts")
    .update({
      title,
      slug,
      excerpt,
      content,
      cover_image: coverImage || null,
      category,
      tags,
      reading_time_min: calculateReadingTimeMinutes(content),
      is_published: isPublished,
      published_at: isPublished ? existing?.published_at ?? new Date().toISOString() : null,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      guest_author_name: guestAuthorName || null,
      guest_author_bio: guestAuthorBio || null,
      allow_comments: allowComments,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: mapDbError(error) };
  }

  revalidatePath("/cultural");
  if (existing?.slug) {
    revalidatePath(`/cultural/${existing.slug}`);
  }
  revalidatePath(`/cultural/${slug}`);
  revalidatePath("/admin/cultural");

  return { ok: true, message: "Культурну статтю оновлено." };
}

export async function deleteCulturalPostAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const id = String(formData.get("id") || "");
  if (!id) {
    return { ok: false, message: "Post ID is required." };
  }

  const { data: row } = await supabase
    .from("cultural_blog_posts")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("cultural_blog_posts").delete().eq("id", id);
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/cultural");
  if (row?.slug) {
    revalidatePath(`/cultural/${row.slug}`);
  }
  revalidatePath("/admin/cultural");

  return { ok: true, message: "Культурну статтю видалено." };
}

export async function togglePublishCulturalPostAction(formData: FormData): Promise<ActionResult> {
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
    .from("cultural_blog_posts")
    .select("slug,published_at")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("cultural_blog_posts")
    .update({
      is_published: publish,
      published_at: publish ? row?.published_at ?? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/cultural");
  if (row?.slug) {
    revalidatePath(`/cultural/${row.slug}`);
  }
  revalidatePath("/admin/cultural");

  return {
    ok: true,
    message: publish ? "Культурну статтю опубліковано." : "Культурну статтю переведено в чернетку.",
  };
}
