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
