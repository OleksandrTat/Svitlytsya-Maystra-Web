"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isSupportedProductModelUrl } from "@/lib/models/product-models";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { ProductStatus } from "@/lib/types";

type ActionResult<T = undefined> = { ok: boolean; message: string; data?: T };

const productSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  short_description: z.string().optional(),
  category: z.string().min(1),
  materials: z.string().default(""),
  style: z.string().default(""),
  cover_image: z.string().url().optional().or(z.literal("")),
  model_3d_url: z
    .union([z.literal(""), z.string().url()])
    .refine((value) => value === "" || isSupportedProductModelUrl(value), {
      message: "Model URL must point to a .glb file.",
    }),
  images: z.string().default(""),
  price_from: z.coerce.number().min(0).optional(),
  formula_id: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  priority: z.coerce.number().int().min(1).max(10).default(5),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_featured: z.boolean().default(false),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  title_en: z.string().optional(),
  description_en: z.string().optional(),
  short_description_en: z.string().optional(),
  seo_title_en: z.string().optional(),
  seo_description_en: z.string().optional(),
});

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

export async function upsertProductAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Service client not configured." };
  }

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: normalizeSlug(String(formData.get("slug") || formData.get("title") || "")),
    description: formData.get("description"),
    short_description: formData.get("short_description") || undefined,
    category: formData.get("category"),
    materials: formData.get("materials") || "",
    style: formData.get("style") || "",
    cover_image: formData.get("cover_image") || "",
    model_3d_url: formData.get("model_3d_url") || "",
    images: formData.get("images") || "",
    price_from: formData.get("price_from") || undefined,
    formula_id: formData.get("formula_id") || "",
    status: formData.get("status") || "draft",
    priority: formData.get("priority") || 5,
    sort_order: formData.get("sort_order") || 0,
    is_featured: formData.get("is_featured") === "true" || formData.get("is_featured") === "on",
    seo_title: formData.get("seo_title") || undefined,
    seo_description: formData.get("seo_description") || undefined,
    title_en: formData.get("title_en") || undefined,
    description_en: formData.get("description_en") || undefined,
    short_description_en: formData.get("short_description_en") || undefined,
    seo_title_en: formData.get("seo_title_en") || undefined,
    seo_description_en: formData.get("seo_description_en") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: "Некоректні дані продукту." };
  }

  const payload = {
    id: parsed.data.id ?? randomUUID(),
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description,
    short_description: parsed.data.short_description || null,
    category: parsed.data.category,
    materials: splitList(parsed.data.materials),
    style: splitList(parsed.data.style),
    cover_image: parsed.data.cover_image || null,
    model_3d_url: parsed.data.model_3d_url || null,
    images: splitList(parsed.data.images),
    price_from: parsed.data.price_from ?? null,
    formula_id: parsed.data.formula_id || null,
    status: parsed.data.status as ProductStatus,
    priority: parsed.data.priority,
    sort_order: parsed.data.sort_order,
    is_featured: parsed.data.is_featured,
    seo_title: parsed.data.seo_title || null,
    seo_description: parsed.data.seo_description || null,
    title_en: parsed.data.title_en || null,
    description_en: parsed.data.description_en || null,
    short_description_en: parsed.data.short_description_en || null,
    seo_title_en: parsed.data.seo_title_en || null,
    seo_description_en: parsed.data.seo_description_en || null,
  };

  const { error } = await supabase.from("products").upsert(payload);
  if (error) {
    return { ok: false, message: error.message };
  }

  // Save translations to site_settings
  const mergeToSettings = async (key: string, raw: FormDataEntryValue | null) => {
    if (!raw) return;
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(String(raw)); } catch { return; }
    if (!Object.keys(parsed).length) return;
    const { data: existing } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
    const merged = { ...(existing?.value as Record<string, unknown> ?? {}), ...parsed };
    await supabase.from("site_settings").upsert({ key, value: merged });
  };
  await Promise.all([
    mergeToSettings("product_category_labels", formData.get("category_labels")),
    mergeToSettings("style_translations", formData.get("style_translations")),
    mergeToSettings("material_translations", formData.get("material_translations")),
  ]);

  revalidatePath("/products");
  revalidatePath(`/products/${payload.slug}`);
  revalidatePath("/admin/products");

  return { ok: true, message: "Продукт збережено.", data: { id: payload.id } };
}

export async function deleteProductAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Service client not configured." };
  }

  const id = String(formData.get("id") || "");
  if (!id) {
    return { ok: false, message: "ID продукту обов'язковий." };
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/products");
  revalidatePath("/admin/products");

  return { ok: true, message: "Продукт видалено." };
}

export async function updateProductSortOrderAction(
  items: { id: string; sort_order: number }[],
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Service client not configured." };
  }

  for (const item of items) {
    await supabase.from("products").update({ sort_order: item.sort_order }).eq("id", item.id);
  }

  revalidatePath("/products");
  revalidatePath("/admin/products");

  return { ok: true, message: "Порядок оновлено." };
}
