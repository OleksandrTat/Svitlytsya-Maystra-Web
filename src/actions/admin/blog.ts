"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type ActionResult<T = undefined> = { ok: boolean; message: string; data?: T };

const blogPostSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, "Заголовок мінімум 3 символи"),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Slug: тільки латиниця, цифри та дефіс"),
  excerpt: z.string().min(10, "Анонс мінімум 10 символів").max(300),
  content: z.string().min(50, "Контент мінімум 50 символів"),
  cover_image: z.string().url().optional().or(z.literal("")),
  category: z.string().min(1, "Оберіть категорію"),
  tags: z.array(z.string()).default([]),
  reading_time_min: z.coerce.number().int().min(1).max(120),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  seo_title: z.string().max(60).optional().or(z.literal("")),
  seo_description: z.string().max(160).optional().or(z.literal("")),
  author_name: z.string().min(2).default("Команда Світлиці"),
  author_avatar: z.string().url().optional().or(z.literal("")),
  related_service_id: z.string().uuid().optional().or(z.literal("")),
  related_product_id: z.string().uuid().optional().or(z.literal("")),
});

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const plainText = content.replace(/<[^>]+>/g, " ");
  const words = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

function generateSlug(title: string): string {
  const translitMap: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye",
    ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l",
    м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "",
    ю: "yu", я: "ya", ё: "yo", э: "e", ы: "y", ъ: "",
  };

  return title
    .toLowerCase()
    .split("")
    .map((char) => translitMap[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function upsertBlogPostAction(
  formData: FormData,
): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, message: "Service client не налаштований." };

  let tags: string[] = [];
  try {
    const tagsRaw = formData.get("tags");
    tags = tagsRaw ? JSON.parse(String(tagsRaw)) : [];
  } catch {
    tags = [];
  }

  const rawData = {
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug") || generateSlug(String(formData.get("title") ?? "")),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    cover_image: formData.get("cover_image") || "",
    category: formData.get("category"),
    tags,
    reading_time_min:
      formData.get("reading_time_min") ||
      calculateReadingTime(String(formData.get("content") ?? "")),
    is_published: formData.get("is_published") === "true",
    is_featured: formData.get("is_featured") === "true",
    seo_title: formData.get("seo_title") || "",
    seo_description: formData.get("seo_description") || "",
    author_name: formData.get("author_name") || "Команда Світлиці",
    author_avatar: formData.get("author_avatar") || "",
    related_service_id: formData.get("related_service_id") || "",
    related_product_id: formData.get("related_product_id") || "",
  };

  const parsed = blogPostSchema.safeParse(rawData);
  if (!parsed.success) {
    const errors = Object.values(parsed.error.flatten().fieldErrors).flat().join(", ");
    return { ok: false, message: `Помилки валідації: ${errors}` };
  }

  const payload = {
    id: parsed.data.id ?? randomUUID(),
    title: parsed.data.title,
    slug: parsed.data.slug,
    excerpt: parsed.data.excerpt,
    content: parsed.data.content,
    cover_image: parsed.data.cover_image || null,
    category: parsed.data.category,
    tags: parsed.data.tags,
    reading_time_min: parsed.data.reading_time_min,
    is_published: parsed.data.is_published,
    is_featured: parsed.data.is_featured,
    seo_title: parsed.data.seo_title || null,
    seo_description: parsed.data.seo_description || null,
    author_name: parsed.data.author_name,
    author_avatar: parsed.data.author_avatar || null,
    related_service_id: parsed.data.related_service_id || null,
    related_product_id: parsed.data.related_product_id || null,
  };

  const { error } = await supabase.from("blog_posts").upsert(payload);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/blog");
  revalidatePath(`/blog/${payload.slug}`);
  revalidatePath("/admin/blog");
  revalidatePath("/");

  return {
    ok: true,
    message: parsed.data.is_published ? "Статтю опубліковано." : "Чернетку збережено.",
    data: { id: payload.id, slug: payload.slug },
  };
}

export async function deleteBlogPostAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, message: "Service client не налаштований." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "ID не вказано." };

  const { data: post } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/blog");
  if (post?.slug) revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/admin/blog");

  return { ok: true, message: "Статтю видалено." };
}

export async function toggleBlogPostPublishedAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, message: "Service client не налаштований." };

  const id = String(formData.get("id") ?? "");
  const isPublished = formData.get("is_published") === "true";

  const { data: post, error } = await supabase
    .from("blog_posts")
    .update({ is_published: isPublished })
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error) return { ok: false, message: error.message };

  revalidatePath("/blog");
  if (post?.slug) revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/admin/blog");

  return {
    ok: true,
    message: isPublished ? "Статтю опубліковано." : "Статтю знято з публікації.",
  };
}

export async function generateBlogSlugAction(title: string): Promise<string> {
  return generateSlug(title);
}
