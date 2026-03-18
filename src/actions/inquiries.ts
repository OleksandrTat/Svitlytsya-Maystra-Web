"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { inquirySchema, type InquirySchema } from "@/lib/validation/inquiry";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { adminNewInquiryEmail, clientInquiryConfirmationEmail } from "@/lib/email/templates";
import { sendAdminEmail, sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
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
  const siteUrl = env.siteUrl;
  const adminEmail = adminNewInquiryEmail({
    name: payload.name,
    phone: payload.phone,
    email: payload.email,
    serviceType: payload.service_type,
    message: payload.message,
    sourcePage: payload.source_page,
    configuration: payload.configuration,
    adminUrl: `${siteUrl}/admin/inquiries`,
    lang: "uk",
  });

  const adminResult = await sendAdminEmail({
    subject: adminEmail.subject,
    html: adminEmail.html,
  });

  if (!adminResult.ok) {
    logger.error("Не вдалося надіслати адміністративний лист для нової заявки.", adminResult.error);
  }

  if (payload.email) {
    const clientEmail = clientInquiryConfirmationEmail({
      name: payload.name,
      serviceType: payload.service_type,
      message: payload.message,
      siteUrl,
      lang: "uk",
    });

    const clientResult = await sendEmail({
      to: payload.email,
      subject: clientEmail.subject,
      html: clientEmail.html,
    });

    if (!clientResult.ok) {
      logger.error("Не вдалося надіслати підтвердження клієнту для нової заявки.", clientResult.error);
    }
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
    logger.error("Помилка під час збереження заявки в базі даних.", error.message);
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
