"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().min(5),
  answer: z.string().min(10),
  category: z.string().min(1),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_published: z.boolean().default(true),
});

export async function upsertFaqItemAction(formData: FormData) {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, message: "Service client не налаштований." };

  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    question: formData.get("question"),
    answer: formData.get("answer"),
    category: formData.get("category"),
    sort_order: formData.get("sort_order") || 0,
    is_published: formData.get("is_published") === "true",
  });
  if (!parsed.success) {
    return {
      ok: false,
      message:
        "Помилки валідації: " +
        Object.values(parsed.error.flatten().fieldErrors).flat().join(", "),
    };
  }

  const payload = { id: parsed.data.id ?? randomUUID(), ...parsed.data };

  // Save EN translations for the item
  const question_en = formData.get("question_en");
  const answer_en = formData.get("answer_en");
  if (typeof question_en === "string" || typeof answer_en === "string") {
    Object.assign(payload, {
      ...(question_en ? { question_en } : {}),
      ...(answer_en ? { answer_en } : {}),
    });
  }

  const { error } = await supabase.from("faq_items").upsert(payload);
  if (error) return { ok: false, message: error.message };

  // Save category labels to site_settings if provided
  const labelUk = String(formData.get("category_label_uk") ?? "").trim();
  const labelEn = String(formData.get("category_label_en") ?? "").trim();
  const category = parsed.data.category;

  if (labelUk || labelEn) {
    const { data: existing } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "faq_category_labels")
      .maybeSingle();

    const current = (existing?.value ?? {}) as Record<string, { uk?: string; en?: string }>;
    current[category] = {
      ...current[category],
      ...(labelUk ? { uk: labelUk } : {}),
      ...(labelEn ? { en: labelEn } : {}),
    };

    await supabase
      .from("site_settings")
      .upsert({ key: "faq_category_labels", value: current });
  }

  revalidatePath("/faq");
  revalidatePath("/admin/faq");
  return { ok: true, message: "FAQ збережено." };
}

export async function deleteFaqItemAction(formData: FormData) {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, message: "Service client не налаштований." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "ID не вказано." };

  const { error } = await supabase.from("faq_items").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/faq");
  revalidatePath("/admin/faq");
  return { ok: true, message: "FAQ видалено." };
}

export async function updateFaqSortOrderAction(
  items: { id: string; sort_order: number }[],
) {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, message: "Service client не налаштований." };

  for (const item of items) {
    await supabase
      .from("faq_items")
      .update({ sort_order: item.sort_order })
      .eq("id", item.id);
  }
  revalidatePath("/faq");
  revalidatePath("/admin/faq");
  return { ok: true, message: "Порядок оновлено." };
}
