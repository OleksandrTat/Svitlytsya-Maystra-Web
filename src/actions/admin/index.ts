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
  };

  const { error } = await supabase.from("projects").upsert(payload);

  if (error) {
    return { ok: false, message: "Не вдалося зберегти проєкт." };
  }

  await logActivity(parsed.data.id ? "update" : "create", "project", payload.id, payload);

  revalidatePath("/");
  revalidatePath("/catalog");
  revalidatePath(`/catalog/${payload.slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/projects");

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
    short_description: formData.get("short_description"),
    description: formData.get("description"),
    process_steps: formData.get("process_steps") || "",
    cover_image: formData.get("cover_image"),
    sort_order: formData.get("sort_order") || 0,
  });

  if (!parsed.success) {
    return { ok: false, message: "Некоректні дані послуги." };
  }

  const payload = {
    id: parsed.data.id ?? randomUUID(),
    title: parsed.data.title,
    slug: parsed.data.slug,
    short_description: parsed.data.short_description,
    description: parsed.data.description,
    process_steps: splitList(parsed.data.process_steps),
    cover_image: parsed.data.cover_image,
    sort_order: parsed.data.sort_order,
  };

  const { error } = await supabase.from("services").upsert(payload);

  if (error) {
    return { ok: false, message: "Не вдалося зберегти послугу." };
  }

  await logActivity(parsed.data.id ? "update" : "create", "service", payload.id, payload);

  revalidatePath("/services");
  revalidatePath(`/services/${payload.slug}`);
  revalidatePath("/admin/services");

  return { ok: true, message: "Послугу збережено." };
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

  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) {
    return { ok: false, message: "Не вдалося видалити послугу." };
  }

  await logActivity("delete", "service", id, null);

  revalidatePath("/services");
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

