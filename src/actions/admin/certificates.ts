"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function upsertCertificateAction(formData: FormData) {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, message: "Service client не налаштований." };

  const id = String(formData.get("id") || "") || randomUUID();
  const title = String(formData.get("title") || "").trim();
  const issuer = String(formData.get("issuer") || "").trim();
  if (!title || !issuer)
    return { ok: false, message: "Назва та видавець обов'язкові." };

  const payload = {
    id,
    title,
    issuer,
    issued_year: Number(formData.get("issued_year")) || null,
    description: String(formData.get("description") || "").trim() || null,
    image_url: String(formData.get("image_url") || "").trim() || null,
    sort_order: Number(formData.get("sort_order") || 0),
    is_published: formData.get("is_published") === "true",
  };

  const { error } = await supabase.from("certificates").upsert(payload);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/admin/certificates");
  return { ok: true, message: "Сертифікат збережено." };
}

export async function deleteCertificateAction(formData: FormData) {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, message: "Service client не налаштований." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "ID не вказано." };

  const { error } = await supabase.from("certificates").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/admin/certificates");
  return { ok: true, message: "Сертифікат видалено." };
}
