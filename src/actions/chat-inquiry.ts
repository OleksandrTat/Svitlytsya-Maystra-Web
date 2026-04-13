"use server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function submitChatInquiryAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const message = (formData.get("message") as string | null)?.trim() ?? "";

  if (!name || name.length < 2) {
    return { ok: false, message: "Вкажіть ваше ім'я (мінімум 2 символи)." };
  }
  if (!phone && !message) {
    return { ok: false, message: "Вкажіть телефон або повідомлення." };
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Сервіс тимчасово недоступний." };
  }

  const { error } = await supabase.from("inquiries").insert({
    name,
    phone: phone || null,
    email: null,
    service_type: "Інше",
    message: message || null,
    source_page: "chat",
    status: "new",
  });

  if (error) {
    return { ok: false, message: "Помилка збереження. Спробуйте ще раз." };
  }

  return { ok: true, message: "Дякуємо! Ми зв'яжемось найближчим часом." };
}
