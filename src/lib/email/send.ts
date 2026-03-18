import { Resend } from "resend";
import { env, hasAdminEmail, hasEmailService } from "@/lib/env";
import { logger } from "@/lib/logger";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | string[];
};

type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function getSafeFromEmail() {
  const configured = env.resendFromEmail?.trim();

  if (!configured) {
    return "onboarding@resend.dev";
  }

  return configured;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTextAsHtml(text: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1a1a1a;">${escapeHtml(text).replace(/\r?\n/g, "<br />")}</div>`;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!hasEmailService) {
    logger.warn("Пропущено надсилання email: RESEND_API_KEY не налаштовано.");
    return { ok: false, error: "Email service not configured" };
  }

  const html = params.html ?? (params.text ? renderTextAsHtml(params.text) : "");

  if (!html && !params.text) {
    logger.warn("Пропущено надсилання email: порожній вміст листа.");
    return { ok: false, error: "Email content is empty" };
  }

  const resend = new Resend(env.resendApiKey!);
  const from = getSafeFromEmail();

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html,
      ...(params.text ? { text: params.text } : {}),
      ...(params.replyTo ? { reply_to: params.replyTo } : {}),
    });

    if (error) {
      logger.error("Помилка Resend під час надсилання email.", error);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id ?? "unknown" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Неочікувана помилка під час надсилання email.", error);
    return { ok: false, error: message };
  }
}

export async function sendAdminEmail(params: {
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string | string[];
}): Promise<SendEmailResult> {
  if (!hasAdminEmail) {
    logger.warn("ADMIN_EMAIL не налаштовано, адміністративний лист пропущено.");
    return { ok: false, error: "ADMIN_EMAIL not configured" };
  }

  return sendEmail({
    to: env.adminEmail!,
    subject: params.subject,
    html: params.html,
    text: params.text,
    replyTo: params.replyTo,
  });
}
