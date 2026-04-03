import { AccountDeletionRequestForm } from "@/components/profile/account-deletion-request-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileLayout } from "@/components/layout/profile-layout";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    <>
      <PageHero
        title="Мій профіль"
        breadcrumbs={[
          { label: "Головна", href: "/" },
          { label: "Профіль" },
        ]}
        height="h-[180px]"
      />
      <ProfileLayout>
        <div className="space-y-8">
          <ProfileForm
            userId={user.id}
            email={user.email ?? ""}
            initialDisplayName={
              profile?.display_name ?? (user.user_metadata?.display_name as string) ?? ""
            }
            initialBio={profile?.bio ?? ""}
            initialAvatarUrl={profile?.avatar_url ?? ""}
          />

          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
            <h3 className="font-display text-lg font-semibold text-red-900">Небезпечна зона</h3>
            <p className="mt-1 text-sm text-red-700/70">
              Видалення акаунту є незворотнім і призведе до втрати всіх даних.
            </p>
            <div className="mt-4">
              <AccountDeletionRequestForm />
            </div>
          </div>
        </div>
      </ProfileLayout>
    </>
  );
}
