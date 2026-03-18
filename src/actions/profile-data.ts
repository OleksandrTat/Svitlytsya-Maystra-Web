"use server";

import { sendAdminEmail } from "@/lib/email/send";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DataExportResult = {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function exportMyDataAction(): Promise<DataExportResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You need to be signed in." };
  }

  const [profile, inquiries, orders, messages] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("inquiries").select("*").eq("email", user.email ?? ""),
    supabase.from("orders").select("*").eq("user_id", user.id),
    supabase.from("order_messages").select("*").eq("sender_id", user.id),
  ]);

  return {
    ok: true,
    message: "Data exported.",
    data: {
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile.data ?? null,
      inquiries: inquiries.data ?? [],
      orders: orders.data ?? [],
      messages: messages.data ?? [],
    },
  };
}

export async function requestAccountDeletionAction(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You need to be signed in." };
  }

  const displayName =
    typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()
      ? user.user_metadata.display_name.trim()
      : user.email?.split("@")[0] ?? "Користувач";

  const recentThreshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: existingRequest } = await supabase
    .from("inquiries")
    .select("id,created_at")
    .eq("email", user.email ?? "")
    .eq("service_type", "account_deletion_request")
    .gte("created_at", recentThreshold)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRequest) {
    return {
      ok: true,
      message: "Запит уже надіслано. Адміністратор зв'яжеться з вами після перевірки.",
    };
  }

  const { error: insertError } = await supabase.from("inquiries").insert({
    name: displayName,
    phone: "not_provided",
    email: user.email ?? null,
    service_type: "account_deletion_request",
    source_page: "/profile",
    message: `Користувач ${displayName} (${user.email ?? user.id}) запросив видалення акаунта.`,
    status: "new",
  });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  await sendAdminEmail({
    subject: "Новий запит на видалення акаунта",
    text: [
      `Користувач: ${displayName}`,
      `Email: ${user.email ?? "невідомо"}`,
      "Джерело: /profile",
      "Перегляд заявок: /admin/inquiries",
    ].join("\n"),
  });

  return {
    ok: true,
    message: "Запит на видалення акаунта надіслано. Ми обробимо його після перевірки.",
  };
}
