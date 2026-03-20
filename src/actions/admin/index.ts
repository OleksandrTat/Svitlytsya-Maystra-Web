"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { randomUUID } from "crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  projectFormSchema,
  serviceFormSchema,
  settingFormSchema,
  testimonialFormSchema,
} from "@/lib/validation/admin";
import type { InquiryStatus } from "@/lib/types";
import type { Json } from "@/lib/types/database";

type ActionResult = {
  ok: boolean;
  message: string;
};

async function logActivity(
  action: string,
  entity: string,
  entityId: string | null,
  payload: Record<string, unknown> | null,
) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return;
  }

  await supabase.from("activity_logs").insert({
    action,
    entity,
    entity_id: entityId,
    payload: payload as Json,
  });
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFormBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function parseNullableString(value: FormDataEntryValue | null) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function parseNullableInteger(value: FormDataEntryValue | null) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableNumber(value: FormDataEntryValue | null) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseJsonArray<T>(value: FormDataEntryValue | null, fallback: T[] = []) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(normalized);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export async function upsertProjectAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase не налаштований." };
  }

  const parsed = projectFormSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    category: formData.get("category"),
    style: formData.get("style") || "",
    materials: formData.get("materials") || "",
    dimensions: formData.get("dimensions") || undefined,
    location: formData.get("location") || undefined,
    completed_at: formData.get("completed_at") || undefined,
    duration_days: formData.get("duration_days") || undefined,
    status: formData.get("status"),
    privacy_level: formData.get("privacy_level") || "public",
    is_featured: parseFormBoolean(formData.get("is_featured")),
    cover_image: formData.get("cover_image"),
    images: formData.get("images") || "",
    blurred_images: formData.get("blurred_images") || "",
    private_client_name: formData.get("private_client_name") || undefined,
    private_location: formData.get("private_location") || undefined,
    private_notes: formData.get("private_notes") || undefined,
    seo_title: formData.get("seo_title") || undefined,
    seo_description: formData.get("seo_description") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: "Некоректні дані проєкту." };
  }

  const payload = {
    id: parsed.data.id ?? randomUUID(),
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description,
    category: parsed.data.category,
    style: splitList(parsed.data.style),
    materials: splitList(parsed.data.materials),
    dimensions: parsed.data.dimensions || null,
    location: parsed.data.location || null,
    completed_at: parsed.data.completed_at || null,
    duration_days: parsed.data.duration_days || null,
    status: parsed.data.status,
    privacy_level: parsed.data.privacy_level,
    is_featured: parsed.data.is_featured,
    cover_image: parsed.data.cover_image,
    images: splitList(parsed.data.images),
    blurred_images: splitList(parsed.data.blurred_images),
    private_client_name: parsed.data.private_client_name || null,
    private_location: parsed.data.private_location || null,
    private_notes: parsed.data.private_notes || null,
    seo_title: parsed.data.seo_title || null,
    seo_description: parsed.data.seo_description || null,
  };

  const { error } = await supabase.from("projects").upsert(payload);

  if (error) {
    return { ok: false, message: "Не вдалося зберегти проєкт." };
  }

  if (formData.has("product_ids")) {
    const productIds = splitList(String(formData.get("product_ids") || ""));
    const { data: existingLinks, error: existingLinksError } = await supabase
      .from("project_products")
      .select("product_id, quantity, notes")
      .eq("project_id", payload.id);

    if (existingLinksError) {
      return { ok: false, message: existingLinksError.message };
    }

    const existingMap = new Map(
      (existingLinks ?? []).map((row) => [
        row.product_id,
        { quantity: row.quantity, notes: row.notes },
      ]),
    );

    if (productIds.length > 0) {
      const rows = productIds.map((productId, index) => ({
        project_id: payload.id,
        product_id: productId,
        quantity: existingMap.get(productId)?.quantity ?? 1,
        notes: existingMap.get(productId)?.notes ?? null,
        sort_order: index,
      }));

      const productIdsToDelete = (existingLinks ?? [])
        .map((row) => row.product_id)
        .filter((productId) => !productIds.includes(productId));

      if (productIdsToDelete.length > 0) {
        const { error: deleteMissingError } = await supabase
          .from("project_products")
          .delete()
          .eq("project_id", payload.id)
          .in("product_id", productIdsToDelete);

        if (deleteMissingError) {
          return { ok: false, message: deleteMissingError.message };
        }
      }

      const { error: upsertLinksError } = await supabase
        .from("project_products")
        .upsert(rows, { onConflict: "project_id,product_id" });

      if (upsertLinksError) {
        return { ok: false, message: upsertLinksError.message };
      }
    } else {
      const { error: clearLinksError } = await supabase
        .from("project_products")
        .delete()
        .eq("project_id", payload.id);

      if (clearLinksError) {
        return { ok: false, message: clearLinksError.message };
      }
    }
  }

  await logActivity(parsed.data.id ? "update" : "create", "project", payload.id, payload);

  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath(`/catalog/${payload.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/products");

  return { ok: true, message: "Проєкт збережено." };
}

export async function deleteProjectAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  if (!id) {
    return { ok: false, message: "Не вказано ID проєкту." };
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase не налаштований." };
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return { ok: false, message: "Не вдалося видалити проєкт." };
  }

  await logActivity("delete", "project", id, null);

  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath("/admin");
  revalidatePath("/admin/projects");

  return { ok: true, message: "Проєкт видалено." };
}

export async function upsertServiceAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase не налаштований." };
  }

  const parsed = serviceFormSchema.safeParse({
    id: formData.get("id") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    tagline: formData.get("tagline") || "",
    short_description: formData.get("short_description"),
    description: formData.get("description"),
    icon: formData.get("icon") || "",
    category: formData.get("category") || "production",
    features: formData.get("features") || "[]",
    process_steps: formData.get("process_steps") || "[]",
    cover_image: formData.get("cover_image") || "",
    price_from: formData.get("price_from") || undefined,
    price_unit: formData.get("price_unit") || "грн",
    duration_days_from: formData.get("duration_days_from") || undefined,
    duration_days_to: formData.get("duration_days_to") || undefined,
    is_active: parseFormBoolean(formData.get("is_active")),
    is_featured: parseFormBoolean(formData.get("is_featured")),
    seo_title: formData.get("seo_title") || undefined,
    seo_description: formData.get("seo_description") || undefined,
    sort_order: formData.get("sort_order") || 0,
  });

  if (!parsed.success) {
    return { ok: false, message: "Некоректні дані послуги." };
  }

  const { data: existing } = parsed.data.id
    ? await supabase
        .from("services")
        .select("slug, gallery")
        .eq("id", parsed.data.id)
        .maybeSingle()
    : { data: null };

  const payload = {
    id: parsed.data.id ?? randomUUID(),
    title: parsed.data.title,
    slug: parsed.data.slug,
    tagline: parsed.data.tagline || null,
    short_description: parsed.data.short_description,
    description: parsed.data.description,
    icon: parsed.data.icon || null,
    category: parsed.data.category,
    features: parseJsonArray(formData.get("features")) as Json,
    process_steps: parseJsonArray(formData.get("process_steps")) as Json,
    cover_image: parsed.data.cover_image || null,
    gallery: Array.isArray(existing?.gallery) ? existing.gallery : [],
    price_from: parseNullableNumber(formData.get("price_from")),
    price_unit: parsed.data.price_unit || "грн",
    duration_days_from: parseNullableInteger(formData.get("duration_days_from")),
    duration_days_to: parseNullableInteger(formData.get("duration_days_to")),
    is_active: parsed.data.is_active,
    is_featured: parsed.data.is_featured,
    seo_title: parsed.data.seo_title || null,
    seo_description: parsed.data.seo_description || null,
    sort_order: parsed.data.sort_order,
  };

  const { error } = await supabase.from("services").upsert(payload);

  if (error) {
    return { ok: false, message: "Не вдалося зберегти послугу." };
  }

  await logActivity(parsed.data.id ? "update" : "create", "service", payload.id, payload);

  revalidatePath("/");
  revalidatePath("/services");
  if (existing?.slug && existing.slug !== payload.slug) {
    revalidatePath(`/services/${existing.slug}`);
  }
  revalidatePath(`/services/${payload.slug}`);
  revalidatePath("/admin/services");

  return { ok: true, message: "Послугу збережено." };
}

export async function toggleServiceActiveAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    return { ok: false, message: "Не вказано ID послуги." };
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase не налаштований." };
  }

  const isActive = parseFormBoolean(formData.get("is_active"));

  const { data: row, error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error) {
    return { ok: false, message: "Не вдалося оновити статус послуги." };
  }

  await logActivity("update", "service", id, { is_active: isActive });

  revalidatePath("/");
  revalidatePath("/services");
  if (row?.slug) {
    revalidatePath(`/services/${row.slug}`);
  }
  revalidatePath("/admin/services");

  return { ok: true, message: "Статус послуги оновлено." };
}

export async function toggleServiceFeaturedAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    return { ok: false, message: "Не вказано ID послуги." };
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase не налаштований." };
  }

  const isFeatured = parseFormBoolean(formData.get("is_featured"));

  const { data: row, error } = await supabase
    .from("services")
    .update({ is_featured: isFeatured })
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error) {
    return { ok: false, message: "Не вдалося оновити виділення послуги." };
  }

  await logActivity("update", "service", id, { is_featured: isFeatured });

  revalidatePath("/");
  revalidatePath("/services");
  if (row?.slug) {
    revalidatePath(`/services/${row.slug}`);
  }
  revalidatePath("/admin/services");

  return { ok: true, message: "Виділення послуги оновлено." };
}

export async function deleteServiceAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  if (!id) {
    return { ok: false, message: "Не вказано ID послуги." };
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase не налаштований." };
  }

  const { data: existing } = await supabase
    .from("services")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    return { ok: false, message: "Не вдалося видалити послугу." };
  }

  await logActivity("delete", "service", id, null);

  revalidatePath("/");
  revalidatePath("/services");
  if (existing?.slug) {
    revalidatePath(`/services/${existing.slug}`);
  }
  revalidatePath("/admin/services");

  return { ok: true, message: "Послугу видалено." };
}

export async function upsertTestimonialAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase не налаштований." };
  }

  const parsed = testimonialFormSchema.safeParse({
    id: formData.get("id") || undefined,
    author_name: formData.get("author_name"),
    author_location: formData.get("author_location") || undefined,
    content: formData.get("content"),
    rating: formData.get("rating"),
    project_id: formData.get("project_id") || "",
    is_visible: parseFormBoolean(formData.get("is_visible")),
  });

  if (!parsed.success) {
    return { ok: false, message: "Некоректні дані відгуку." };
  }

  const payload = {
    id: parsed.data.id ?? randomUUID(),
    author_name: parsed.data.author_name,
    author_location: parsed.data.author_location || null,
    content: parsed.data.content,
    rating: parsed.data.rating,
    project_id: parsed.data.project_id || null,
    is_visible: parsed.data.is_visible,
  };

  const { error } = await supabase.from("testimonials").upsert(payload);

  if (error) {
    return { ok: false, message: "Не вдалося зберегти відгук." };
  }

  await logActivity(parsed.data.id ? "update" : "create", "testimonial", payload.id, payload);

  revalidatePath("/");
  revalidatePath("/admin/testimonials");

  return { ok: true, message: "Відгук збережено." };
}

export async function deleteTestimonialAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  if (!id) {
    return { ok: false, message: "Не вказано ID відгуку." };
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase не налаштований." };
  }

  const { error } = await supabase.from("testimonials").delete().eq("id", id);

  if (error) {
    return { ok: false, message: "Не вдалося видалити відгук." };
  }

  await logActivity("delete", "testimonial", id, null);

  revalidatePath("/");
  revalidatePath("/admin/testimonials");

  return { ok: true, message: "Відгук видалено." };
}

export async function updateInquiryStatusAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as InquiryStatus;

  if (!id || !status) {
    return { ok: false, message: "Некоректні дані заявки." };
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase не налаштований." };
  }

  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);

  if (error) {
    return { ok: false, message: "Не вдалося змінити статус заявки." };
  }

  await logActivity("update", "inquiry", id, { status });

  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");
  revalidateTag("admin-counts", "default");

  return { ok: true, message: "Статус заявки оновлено." };
}

export async function upsertCompanyInfoAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase не налаштований." };
  }

  const providedId = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();

  if (!name) {
    return { ok: false, message: "Назва компанії обов'язкова." };
  }

  let companyId = providedId;
  if (!companyId) {
    const { data: existingCompany } = await supabase
      .from("company_info")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    companyId = existingCompany?.id ?? randomUUID();
  }

  const payload = {
    id: companyId,
    name,
    tagline: parseNullableString(formData.get("tagline")),
    description: parseNullableString(formData.get("description")),
    founded_year: parseNullableInteger(formData.get("founded_year")),
    email: parseNullableString(formData.get("email")),
    phone: parseNullableString(formData.get("phone")),
    phone_secondary: parseNullableString(formData.get("phone_secondary")),
    address: parseNullableString(formData.get("address")),
    city: parseNullableString(formData.get("city")),
    country: parseNullableString(formData.get("country")),
    working_hours: parseNullableString(formData.get("working_hours")),
    social_facebook: parseNullableString(formData.get("social_facebook")),
    social_instagram: parseNullableString(formData.get("social_instagram")),
    social_youtube: parseNullableString(formData.get("social_youtube")),
    social_tiktok: parseNullableString(formData.get("social_tiktok")),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("company_info").upsert(payload);

  if (error) {
    return { ok: false, message: "Не вдалося зберегти дані компанії." };
  }

  await logActivity(providedId ? "update" : "create", "company_info", companyId, payload);

  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/admin");
  revalidatePath("/admin/company");

  return { ok: true, message: "Дані компанії збережено." };
}

export async function upsertSiteSettingAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase не налаштований." };
  }

  const parsed = settingFormSchema.safeParse({
    key: formData.get("key"),
    value: formData.get("value"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: "Некоректні дані налаштування." };
  }

  let parsedValue: unknown = parsed.data.value;
  try {
    parsedValue = JSON.parse(parsed.data.value);
  } catch {
    // keep text value if not JSON
  }

  const payload = {
    key: parsed.data.key,
    value: parsedValue as Json,
    description: parsed.data.description || null,
  };

  const { error } = await supabase.from("site_settings").upsert(payload);

  if (error) {
    return { ok: false, message: "Не вдалося зберегти налаштування." };
  }

  await logActivity("update", "site_setting", payload.key, payload as Record<string, unknown>);

  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");

  return { ok: true, message: "Налаштування оновлено." };
}

