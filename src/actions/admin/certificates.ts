"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

function str(fd: FormData, key: string) {
  return (fd.get(key) as string | null)?.trim() || null;
}

export async function upsertCertificateAction(formData: FormData) {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, message: "Service client не налаштований." };

  const title = str(formData, "title");
  const issuer = str(formData, "issuer");
  if (!title || !issuer)
    return { ok: false, message: "Назва та видавець обов'язкові." };

  const id = str(formData, "id");
  const isNew = !id;

  const payload = {
    title,
    issuer,
    issued_year: Number(formData.get("issued_year")) || null,
    description: str(formData, "description"),
    image_url: str(formData, "image_url"),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_published: formData.get("is_published") === "true",
    // EN
    title_en: str(formData, "title_en"),
    issuer_en: str(formData, "issuer_en"),
    description_en: str(formData, "description_en"),
    // SEO
    seo_title: str(formData, "seo_title"),
    seo_description: str(formData, "seo_description"),
    seo_title_en: str(formData, "seo_title_en"),
    seo_description_en: str(formData, "seo_description_en"),
    updated_at: new Date().toISOString(),
  };

  let savedId = id;

  if (isNew) {
    const { data, error } = await supabase
      .from("certificates")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) return { ok: false, message: error?.message ?? "Помилка збереження." };
    savedId = data.id;
  } else {
    const { error } = await supabase
      .from("certificates")
      .update(payload)
      .eq("id", id!);
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/certificates");

  return { ok: true, message: isNew ? "Сертифікат створено." : "Сертифікат оновлено.", id: savedId };
}

export async function deleteCertificateAction(formData: FormData) {
  await requireAdmin();
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, message: "Service client не налаштований." };

  const id = (formData.get("id") as string | null)?.trim();
  if (!id) return { ok: false, message: "ID не вказано." };

  const { error } = await supabase.from("certificates").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/");
  revalidatePath("/admin/certificates");
  return { ok: true, message: "Сертифікат видалено." };
}
