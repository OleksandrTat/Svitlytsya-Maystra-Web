import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { token } = await request.json().catch(() => ({ token: null }));
  if (!token) {
    return NextResponse.json({ ok: false });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false });
  }

  const { data: invitation } = await supabase
    .from("client_invitations")
    .select("id, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (
    !invitation ||
    invitation.status !== "pending" ||
    new Date(invitation.expires_at) < new Date()
  ) {
    return NextResponse.json({ ok: false, message: "Invalid or expired invitation." });
  }

  await supabase
    .from("client_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return NextResponse.json({ ok: true });
}
