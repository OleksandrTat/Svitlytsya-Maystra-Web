"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";
import { inquirySchema, type InquirySchema } from "@/lib/validation/inquiry";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { env, hasResend } from "@/lib/env";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

type InquiryActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map<string, number[]>();

function checkRateLimit(identity: string) {
  const now = Date.now();
  const timestamps = rateLimitStore.get(identity) ?? [];
  const recent = timestamps.filter((stamp) => now - stamp <= RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    return false;
  }

  recent.push(now);
  rateLimitStore.set(identity, recent);

  return true;
}

function normalizeInquiryInput(input: InquirySchema) {
  return {
    name: input.name,
    phone: input.phone,
    email: input.email?.trim() || null,
    service_type: input.service_type,
    message: input.message?.trim() || null,
    source_page: input.source_page?.trim() || null,
    project_ref_id: input.project_ref_id?.trim() || null,
    status: "new" as const,
  };
}

async function sendInquiryEmails(payload: ReturnType<typeof normalizeInquiryInput>) {
  if (!hasResend) {
    return;
  }

  const resend = new Resend(env.resendApiKey!);

  await resend.emails.send({
    from: env.resendFromEmail!,
    to: env.adminEmail!,
    subject: `Нова заявка: ${payload.service_type}`,
    html: `
      <h2>Нова заявка з сайту Svitlytsya Maystra</h2>
      <p><strong>Ім'я:</strong> ${payload.name}</p>
      <p><strong>Телефон:</strong> ${payload.phone}</p>
      <p><strong>Email:</strong> ${payload.email ?? "не вказано"}</p>
      <p><strong>Тип послуги:</strong> ${payload.service_type}</p>
      <p><strong>Сторінка:</strong> ${payload.source_page ?? "невідомо"}</p>
      <p><strong>Повідомлення:</strong></p>
      <p>${payload.message ?? "-"}</p>
    `,
  });

  if (payload.email) {
    await resend.emails.send({
      from: env.resendFromEmail!,
      to: payload.email,
      subject: "Ми отримали вашу заявку — Svitlytsya Maystra",
      html: `
        <p>Дякуємо, ${payload.name}!</p>
        <p>Ми отримали вашу заявку та зв'яжемось найближчим часом.</p>
        <p>Тип послуги: ${payload.service_type}</p>
      `,
    });
  }
}

export async function submitInquiryAction(
  _: InquiryActionResult,
  formData: FormData,
): Promise<InquiryActionResult> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  const identity = forwardedFor?.split(",")[0]?.trim() || "unknown";

  if (!checkRateLimit(identity)) {
    return {
      success: false,
      message: "Занадто багато спроб. Спробуйте ще раз через 15 хвилин.",
    };
  }

  const parsed = inquirySchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    service_type: formData.get("service_type"),
    message: formData.get("message"),
    source_page: formData.get("source_page"),
    project_ref_id: formData.get("project_ref_id"),
    honeypot: formData.get("honeypot"),
    turnstile_token: formData.get("cf-turnstile-response") ?? formData.get("turnstile_token"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Перевірте коректність заповнення форми.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.honeypot?.trim()) {
    return {
      success: true,
      message: "Дякуємо! Ми зв'яжемось найближчим часом.",
    };
  }

  const turnstileResult = await verifyTurnstileToken(parsed.data.turnstile_token, identity);

  if (!turnstileResult.success) {
    return {
      success: false,
      message: "Підтвердіть, що ви не робот, і спробуйте ще раз.",
      fieldErrors: { turnstile_token: ["Turnstile verification failed"] },
    };
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return {
      success: false,
      message:
        "Supabase не налаштований. Додайте змінні середовища перед прийомом реальних заявок.",
    };
  }

  const payload = normalizeInquiryInput(parsed.data);

  const { error } = await supabase.from("inquiries").insert(payload);

  if (error) {
    return {
      success: false,
      message: "Не вдалося зберегти заявку. Спробуйте ще раз.",
    };
  }

  await sendInquiryEmails(payload);

  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");

  return {
    success: true,
    message: "Дякуємо! Ми зв'яжемось найближчим часом.",
  };
}

