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

// Accepts either a plain address or "Display Name <addr@example.com>" format.
// Falls back to onboarding@resend.dev when nothing is configured.
function getFromEmail(): string {
  const raw = env.resendFromEmail?.trim();
  if (raw) return raw;
  return "onboarding@resend.dev";
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
    logger.warn("[email] RESEND_API_KEY not set — skipping send.");
    return { ok: false, error: "Email service not configured" };
  }

  const html = params.html ?? (params.text ? renderTextAsHtml(params.text) : "");

  if (!html && !params.text) {
    logger.warn("[email] Empty content — skipping send.");
    return { ok: false, error: "Email content is empty" };
  }

  const resend = new Resend(env.resendApiKey);
  const from = getFromEmail();

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
      logger.error("[email] Resend API error.", `${error.message} (from: ${from}, to: ${String(params.to)})`);
      return { ok: false, error: error.message };
    }

    logger.info(`[email] Sent "${params.subject}" → ${String(params.to)} (id: ${data?.id ?? "?"})`);
    return { ok: true, id: data?.id ?? "unknown" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("[email] Unexpected error.", message);
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
    logger.warn("[email] ADMIN_EMAIL not set — skipping admin send.");
    return { ok: false, error: "ADMIN_EMAIL not configured" };
  }

  return sendEmail({
    to: env.adminEmail!,
    ...params,
  });
}
