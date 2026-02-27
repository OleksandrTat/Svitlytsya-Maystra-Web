import { NextResponse } from "next/server";
import { inquirySchema } from "@/lib/validation/inquiry";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = inquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  if (parsed.data.honeypot?.trim()) {
    return NextResponse.json({ ok: true });
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

