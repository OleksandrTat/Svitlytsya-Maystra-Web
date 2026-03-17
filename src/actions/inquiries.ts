"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Resend } from "resend";
import { inquirySchema, type InquirySchema } from "@/lib/validation/inquiry";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { env, hasResend } from "@/lib/env";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

type InquiryActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const INQUIRY_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const INQUIRY_RATE_LIMIT_MAX_REQUESTS = 5;

function normalizeInquiryInput(input: InquirySchema) {
  let configuration: Record<string, unknown> | null = null;

  if (input.configuration?.trim()) {
    try {
      const parsedConfiguration = JSON.parse(input.configuration);
      if (parsedConfiguration && typeof parsedConfiguration === "object" && !Array.isArray(parsedConfiguration)) {
        configuration = parsedConfiguration as Record<string, unknown>;
      }
    } catch {
      configuration = null;
    }
  }

  return {
    name: input.name,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    service_type: input.service_type,
    message: input.message?.trim() || null,
    source_page: input.source_page?.trim() || null,
    project_ref_id: input.project_ref_id?.trim() || null,
    configuration,
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
      <p><strong>Телефон:</strong> ${payload.phone ?? "не вказано"}</p>
      <p><strong>Email:</strong> ${payload.email ?? "не вказано"}</p>
      <p><strong>Тип послуги:</strong> ${payload.service_type}</p>
      <p><strong>Сторінка:</strong> ${payload.source_page ?? "невідомо"}</p>
      <p><strong>Повідомлення:</strong></p>
      <p>${payload.message ?? "-"}</p>
      ${
        payload.configuration
          ? `<p><strong>Configuration:</strong></p><pre>${JSON.stringify(payload.configuration, null, 2)}</pre>`
          : ""
      }
    `,
  });

  if (payload.email) {
    await resend.emails.send({
      from: env.resendFromEmail!,
      to: payload.email,
      subject: "Ми отримали вашу заявку — Svitlytsya Maystra",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; color: #1A202C; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1A4F8A; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Svitlytsya Maystra</h1>
          </div>
          <div style="border: 1px solid #E2E8F0; border-top: 0; padding: 24px; border-radius: 0 0 12px 12px;">
            <p>Вітаємо, <strong>${payload.name}</strong>!</p>
            <p>Ми отримали вашу заявку і зв'яжемось з вами найближчим часом у робочий час.</p>

            <div style="background: #F5F7FA; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 8px; font-weight: 600;">Деталі заявки:</p>
              <p style="margin: 4px 0; color: #718096;">Тип послуги: ${payload.service_type}</p>
              ${payload.message ? `<p style="margin: 4px 0; color: #718096;">Повідомлення: ${payload.message}</p>` : ""}
            </div>

            <p>
              <a href="${env.siteUrl}/contact" style="
                display: inline-block;
                background: #1A4F8A;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
              ">
                Переглянути наші роботи
              </a>
            </p>

            <p style="color: #718096; font-size: 12px; margin-top: 24px;">
              Svitlytsya Maystra · ${env.siteUrl}
            </p>
          </div>
        </body>
        </html>
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

  const allowed = await checkRateLimit(`inquiry:${identity}`, {
    windowMs: INQUIRY_RATE_LIMIT_WINDOW_MS,
    maxRequests: INQUIRY_RATE_LIMIT_MAX_REQUESTS,
  });

  if (!allowed) {
    return {
      success: false,
      message: "Занадто багато спроб. Спробуйте через 15 хвилин.",
    };
  }

  const parsed = inquirySchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || "",
    email: formData.get("email"),
    service_type: formData.get("service_type"),
    message: formData.get("message"),
    source_page: formData.get("source_page"),
    project_ref_id: formData.get("project_ref_id"),
    configuration: formData.get("configuration"),
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
