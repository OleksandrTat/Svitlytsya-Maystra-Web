import { redirect } from "next/navigation";
import { MfaChallengeForm } from "@/components/admin/mfa-challenge-form";
import { Container } from "@/components/ui/container";
import { isAdminUser } from "@/lib/auth/is-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminMfaChallengePage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/admin/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (!isAdminUser(user)) {
    redirect("/");
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") {
    redirect("/admin");
  }

  return (
    <section className="py-20">
      <Container>
        <MfaChallengeForm />
      </Container>
    </section>
  );
}
