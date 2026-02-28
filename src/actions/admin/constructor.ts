"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type ActionResult = {
  ok: boolean;
  message: string;
};

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/jpg"]);

export async function uploadConfigurationPhotoAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const productType = String(formData.get("product_type") || "");
  const configurationKey = String(formData.get("configuration_key") || "").trim();
  const file = formData.get("file");

  if (
    (productType !== "door" && productType !== "furniture" && productType !== "window") ||
    !configurationKey ||
    !(file instanceof File)
  ) {
    return { ok: false, message: "Некоректні параметри завантаження." };
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, message: "Дозволені тільки JPG/PNG/WEBP зображення." };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, message: "Файл завеликий. Максимум 10MB." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `constructor/${productType}/${configurationKey}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage.from("product-images").getPublicUrl(path);

  const { error: upsertError } = await supabase.from("product_configurations").upsert(
    {
      product_type: productType,
      configuration_key: configurationKey,
      image_url: publicUrlData.publicUrl,
      is_active: true,
      parameters: {},
    },
    { onConflict: "configuration_key" },
  );

  if (upsertError) {
    return { ok: false, message: upsertError.message };
  }

  revalidatePath("/constructor");
  revalidatePath(`/constructor/${productType}`);
  revalidatePath("/admin/constructor");

  return { ok: true, message: "Фото конфігурації збережено." };
}
