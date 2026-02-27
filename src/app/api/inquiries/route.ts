import { NextResponse } from "next/server";
import { inquirySchema } from "@/lib/validation/inquiry";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = inquirySchema.safeParse({
    ...body,
    turnstile_token: body?.turnstile_token ?? body?.["cf-turnstile-response"],
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  if (parsed.data.honeypot?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const identity = forwardedFor?.split(",")[0]?.trim();
  const turnstileResult = await verifyTurnstileToken(parsed.data.turnstile_token, identity);

  if (!turnstileResult.success) {
    return NextResponse.json(
      { ok: false, message: "Turnstile verification failed" },
      { status: 403 },
    );
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "Supabase не налаштований" },
      { status: 500 },
    );
  }

  const { error } = await supabase.from("inquiries").insert({
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email?.trim() || null,
    service_type: parsed.data.service_type,
    message: parsed.data.message?.trim() || null,
    source_page: parsed.data.source_page?.trim() || null,
    project_ref_id: parsed.data.project_ref_id?.trim() || null,
    status: "new",
  });

  if (error) {
    return NextResponse.json(
      { ok: false, message: "Помилка збереження заявки" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

