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
  const { error } = await supabase.from("faq_items").upsert(payload);
  if (error) return { ok: false, message: error.message };

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
