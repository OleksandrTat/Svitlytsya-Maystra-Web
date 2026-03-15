"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

type ActionResult = {
  ok: boolean;
  message: string;
};

type DbErrorLike = {
  code?: string;
  message: string;
};

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function mapProfileError(error: DbErrorLike) {
  if (error.code === "42P01" || /relation .*user_profiles.* does not exist/i.test(error.message)) {
    return "У базі даних відсутня таблиця профілів. Запусти SQL-міграцію для user_profiles.";
  }

  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "Недостатньо прав для оновлення профілю. Увійди в акаунт і спробуй ще раз.";
  }

  return error.message;
}

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Потрібно увійти в акаунт." };
  }

  const displayName = String(formData.get("display_name") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const avatarUrl = String(formData.get("avatar_url") || "").trim();

  if (displayName.length < 2) {
    return { ok: false, message: "Ім'я має містити щонайменше 2 символи." };
  }

  const writeClient = createSupabaseServiceClient() ?? supabase;
  const { error: profileError } = await writeClient.from("user_profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
      bio: bio || null,
      avatar_url: avatarUrl || null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return { ok: false, message: mapProfileError(profileError) };
  }

  await supabase.auth.updateUser({
    data: {
      display_name: displayName,
    },
  });

  revalidatePath("/profile");

  return { ok: true, message: "Профіль оновлено." };
}

export async function updateSubscriptionPreferencesAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Потрібно увійти в акаунт." };
  }

  const preferences = {
    blog_posts: parseBoolean(formData.get("blog_posts")),
    catalog_updates: parseBoolean(formData.get("catalog_updates")),
    promotions: parseBoolean(formData.get("promotions")),
  };

  const consent = parseBoolean(formData.get("consent"));
  const hasAnyEnabled = Object.values(preferences).some(Boolean);

  if (hasAnyEnabled && !consent) {
    return { ok: false, message: "Підтвердіть згоду на отримання email-розсилки." };
  }

  const now = new Date().toISOString();
  const status = hasAnyEnabled ? "subscribed" : "unsubscribed";

  if (user.email) {
    const { error: subscriberError } = await supabase.from("email_subscribers").upsert(
      {
        email: user.email,
        user_id: user.id,
        preferences,
        status,
        subscribed_at: now,
        unsubscribed_at: hasAnyEnabled ? null : now,
        updated_at: now,
      },
      { onConflict: "email" },
    );

    if (subscriberError) {
      return { ok: false, message: "Не вдалося оновити налаштування підписки." };
    }
  }

  const { data: currentProfile } = await supabase
    .from("user_profiles")
    .select("account_types")
    .eq("id", user.id)
    .maybeSingle();

  const currentAccountTypes = currentProfile?.account_types ?? [];
  const nextAccountTypes = hasAnyEnabled
    ? Array.from(new Set([...currentAccountTypes, "email_subscriber"]))
    : currentAccountTypes.filter((value: string) => value !== "email_subscriber");

  const writeClient = createSupabaseServiceClient() ?? supabase;
  const { error: profileError } = await writeClient.from("user_profiles").upsert(
    {
      id: user.id,
      account_types: nextAccountTypes,
      email_preferences: preferences,
      last_seen_at: now,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return { ok: false, message: mapProfileError(profileError) };
  }

  revalidatePath("/profile/subscriptions");

  return {
    ok: true,
    message: hasAnyEnabled ? "Налаштування підписки оновлено." : "Ви відписались від розсилки.",
  };
}
