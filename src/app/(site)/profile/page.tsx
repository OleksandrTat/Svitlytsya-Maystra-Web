import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountDeletionRequestForm } from "@/components/profile/account-deletion-request-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_url, bio")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="py-16">
      <Container>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">Мій профіль</h1>
          <div className="flex gap-3 text-sm">
            <Link href="/profile/orders" className="underline">
              Мої замовлення
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <ProfileForm
            userId={user.id}
            email={user.email ?? ""}
            initialDisplayName={profile?.display_name ?? (user.user_metadata?.display_name as string) ?? ""}
            initialBio={profile?.bio ?? ""}
            initialAvatarUrl={profile?.avatar_url ?? ""}
          />

          <AccountDeletionRequestForm />
        </div>
      </Container>
    </section>
  );
}
