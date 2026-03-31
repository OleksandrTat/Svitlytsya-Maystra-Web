"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { sendAdminEmail } from "@/lib/email/send";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { headers } from "next/headers";

const subscribeSchema = z.object({
  email: z.string().email("Вкажіть коректний email."),
  name: z.string().trim().max(80).optional().or(z.literal("")),
});

export async function subscribeToNewsletterAction(formData: FormData) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed = await checkRateLimit(`newsletter:${ip}`, {
    windowMs: 60_000,
    maxRequests: 3,
  });
  if (!allowed)
    return { ok: false, message: "Занадто багато спроб. Спробуйте пізніше." };

  const parsed = subscribeSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.flatten().fieldErrors.email?.[0] ?? "Помилка.",
    };
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false, message: "Сервіс недоступний." };

  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("id, status")
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (existing?.status === "active") {
    return { ok: true, message: "Ви вже підписані на нашу розсилку." };
  }

  if (existing) {
    await supabase
      .from("newsletter_subscribers")
      .update({
        status: "active",
        name: parsed.data.name || null,
        unsubscribed_at: null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("newsletter_subscribers").insert({
      email: parsed.data.email,
      name: parsed.data.name || null,
      status: "active",
      source: "website",
    });
  }

  await sendAdminEmail({
    subject: `Нова підписка на розсилку: ${parsed.data.email}`,
    text: `Email: ${parsed.data.email}\nІм'я: ${parsed.data.name || "не вказано"}`,
  });

  revalidatePath("/admin/newsletter");
  return { ok: true, message: "Дякуємо за підписку!" };
}

export async function unsubscribeFromNewsletterAction(email: string) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) return { ok: false };

  await supabase
    .from("newsletter_subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("email", email);

  return { ok: true, message: "Ви успішно відписались від розсилки." };
}
