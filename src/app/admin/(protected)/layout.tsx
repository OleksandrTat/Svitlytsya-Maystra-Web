import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/auth/is-admin";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect("/admin/mfa-challenge");
  }

  return <>{children}</>;
}
