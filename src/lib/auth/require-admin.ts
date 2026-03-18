import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/is-admin";

type RequireAdminOptions = {
  enforceMfa?: boolean;
};

export async function requireAdmin(options: RequireAdminOptions = {}) {
  const { enforceMfa = true } = options;
  const loginPath = "/auth/login?next=/admin";
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(loginPath);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(loginPath);
  }

  const isAdmin = isAdminUser(user);

  if (!isAdmin) {
    redirect("/");
  }

  if (enforceMfa) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      redirect("/admin/mfa-challenge");
    }
  }

  return user;
}
