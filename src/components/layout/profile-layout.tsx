import { redirect } from "next/navigation";
import { ProfileSidebar } from "@/components/layout/profile-sidebar";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export async function ProfileLayout({ children }: Props) {
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
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ??
    (user.user_metadata?.display_name as string) ??
    user.email?.split("@")[0] ??
    "Користувач";

  return (
    <section className="py-10 md:py-14">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <ProfileSidebar
            user={{
              displayName,
              email: user.email ?? "",
              avatarUrl: profile?.avatar_url ?? undefined,
            }}
          />
          <div>{children}</div>
        </div>
      </Container>
    </section>
  );
}
