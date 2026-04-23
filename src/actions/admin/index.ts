"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { randomUUID } from "crypto";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  serviceFormSchema,
  settingFormSchema,
  testimonialFormSchema,
} from "@/lib/validation/admin";
import type { InquiryStatus } from "@/lib/types";
import type { Json } from "@/lib/types/database";

type ActionResult<T = undefined> = {
  ok: boolean;
  message: string;
  data?: T;
};

const ENTITY_TABLE_MAP: Record<string, string> = {
  service: "services",
  testimonial: "testimonials",
  inquiry: "inquiries",
  company_info: "company_info",
  site_setting: "site_settings",
};

const ACTION_ENUM_MAP = {
  create: "INSERT",
  update: "UPDATE",
  delete: "DELETE",
} as const;

type ActivityAction = keyof typeof ACTION_ENUM_MAP;

async function logActivity(
  action: ActivityAction,
  entity: string,
  entityId: string | null,
  payload: Record<string, unknown> | null,
) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return;
  }

  let actorId: string | null = null;
  try {
    const serverClient = await createSupabaseServerClient();
    if (serverClient) {
      const { data } = await serverClient.auth.getUser();
      actorId = data.user?.id ?? null;
    }
  } catch {
    actorId = null;
  }

  const tableName = ENTITY_TABLE_MAP[entity] ?? entity;
  const recordId = entityId && /^[0-9a-f-]{36}$/i.test(entityId) ? entityId : null;

  await supabase.from("audit_log").insert({
    actor_id: actorId,
    actor_type: "admin",
    action: ACTION_ENUM_MAP[action],
    table_name: tableName,
    record_id: recordId,
    new_value: action === "delete" ? null : (payload as Json | null),
    old_value: action === "delete" ? (payload as Json | null) : null,
  });
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

export async function upsertServiceAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
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
    category: formData.get("category") || "",
    features: formData.get("features") || "[]",
    process_steps: formData.get("process_steps") || "[]",
    cover_image: formData.get("cover_image") || "",
    price_from: formData.get("price_from") || undefined,
    price_unit: formData.get("price_unit") || "???",
    duration_days_from: formData.get("duration_days_from") || undefined,
    duration_days_to: formData.get("duration_days_to") || undefined,
    is_active: parseFormBoolean(formData.get("is_active")),
    is_featured: parseFormBoolean(formData.get("is_featured")),
    seo_title: formData.get("seo_title") || undefined,
    seo_description: formData.get("seo_description") || undefined,
    sort_order: formData.get("sort_order") || 0,
    title_en: String(formData.get("title_en") ?? ""),
    tagline_en: String(formData.get("tagline_en") ?? ""),
    short_description_en: String(formData.get("short_description_en") ?? ""),
    description_en: String(formData.get("description_en") ?? ""),
    seo_title_en: String(formData.get("seo_title_en") ?? ""),
    seo_description_en: String(formData.get("seo_description_en") ?? ""),
    features_en: formData.get("features_en") || undefined,
    process_steps_en: formData.get("process_steps_en") || undefined,
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
    price_unit: parsed.data.price_unit || "???",
    duration_days_from: parseNullableInteger(formData.get("duration_days_from")),
    duration_days_to: parseNullableInteger(formData.get("duration_days_to")),
    is_active: parsed.data.is_active,
    is_featured: parsed.data.is_featured,
    seo_title: parsed.data.seo_title || null,
    seo_description: parsed.data.seo_description || null,
    sort_order: parsed.data.sort_order,
    title_en: parsed.data.title_en || null,
    tagline_en: parsed.data.tagline_en || null,
    short_description_en: parsed.data.short_description_en || null,
    description_en: parsed.data.description_en || null,
    seo_title_en: parsed.data.seo_title_en || null,
    seo_description_en: parsed.data.seo_description_en || null,
    features_en: parseJsonArray(formData.get("features_en")) as Json || null,
    process_steps_en: parseJsonArray(formData.get("process_steps_en")) as Json || null,
  };

  const { error } = await supabase.from("services").upsert(payload);

  if (error) {
    console.error("[upsertServiceAction] supabase error:", error);
    return {
      ok: false,
      message: `Не вдалося зберегти послугу: ${error.message}`,
    };
  }

  // Persist admin-provided category label overrides directly on the
  // service_categories lookup. Missing rows are auto-created with the
  // slug as a fallback label_uk.
  const rawCatLabels = formData.get("category_labels");
  if (rawCatLabels) {
    try {
      const labels = JSON.parse(String(rawCatLabels)) as Record<string, { uk?: string; en?: string }>;
      for (const [slug, v] of Object.entries(labels)) {
        if (!slug || !v) continue;
        const row: { slug: string; label_uk: string; label_en?: string | null } = {
          slug,
          label_uk: v.uk || slug,
        };
        if (v.en !== undefined) row.label_en = v.en || null;
        await supabase.from("service_categories").upsert(row, { onConflict: "slug" });
      }
    } catch { /* ignore */ }
  }

  await logActivity(parsed.data.id ? "update" : "create", "service", payload.id, payload);

  revalidatePath("/");
  revalidatePath("/services");
  if (existing?.slug && existing.slug !== payload.slug) {
    revalidatePath(`/services/${existing.slug}`);
  }
  revalidatePath(`/services/${payload.slug}`);
  revalidatePath("/admin/services");

  return { ok: true, message: "Послугу збережено.", data: { id: payload.id } };
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
    product_id: formData.get("product_id") || undefined,
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
    product_id: parsed.data.product_id || null,
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
