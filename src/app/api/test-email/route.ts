import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";

// ⚠️  DEV ONLY — remove or protect this route before deploying to production.
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production." }, { status: 403 });
  }

  const to = env.adminEmail;

  if (!to) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_EMAIL is not set in .env.local" },
      { status: 500 },
    );
  }

  if (!env.resendApiKey) {
    return NextResponse.json(
      { ok: false, error: "RESEND_API_KEY is not set in .env.local" },
      { status: 500 },
    );
  }

  const result = await sendEmail({
    to,
    subject: "✅ Test email from Svitlytsya Maystra",
    html: `
      <div style="font-family:sans-serif;padding:32px;max-width:480px;">
        <h2 style="color:#190000;">Тест пройшов успішно 🎉</h2>
        <p>Якщо ти бачиш цей лист — Resend налаштовано правильно.</p>
        <ul>
          <li><strong>From:</strong> ${env.resendFromEmail ?? "onboarding@resend.dev"}</li>
          <li><strong>To:</strong> ${to}</li>
          <li><strong>API key:</strong> ${env.resendApiKey.slice(0, 8)}…</li>
          <li><strong>Time:</strong> ${new Date().toISOString()}</li>
        </ul>
      </div>
    `,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: result.id, to });
}
