"use server";

import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

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
  const serviceClient = createSupabaseServiceClient();

  if (!supabase || !serviceClient) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You need to be signed in." };
  }

  const anonymizedEmail = `deleted+${user.id}@example.invalid`;

  await serviceClient
    .from("user_profiles")
    .update({
      display_name: "Deleted User",
      bio: null,
      avatar_url: null,
      account_types: [],
      email_preferences: {},
    })
    .eq("id", user.id);

  await serviceClient.auth.admin.updateUserById(user.id, {
    email: anonymizedEmail,
    user_metadata: {
      deleted: true,
    },
  });

  return {
    ok: true,
    message: "Deletion request has been processed. Your account is anonymized.",
  };
}
