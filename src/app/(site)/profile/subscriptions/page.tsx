import Link from "next/link";
import { redirect } from "next/navigation";
import { SubscriptionPreferencesForm } from "@/components/profile/subscription-preferences-form";
import { Container } from "@/components/ui/container";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Preferences = {
  blog_posts: boolean;
  catalog_updates: boolean;
  promotions: boolean;
};

function parsePreferences(value: unknown): Preferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      blog_posts: false,
      catalog_updates: false,
      promotions: false,
    };
  }

  return {
    blog_posts: Boolean((value as Record<string, unknown>).blog_posts),
    catalog_updates: Boolean((value as Record<string, unknown>).catalog_updates),
    promotions: Boolean((value as Record<string, unknown>).promotions),
  };
}

export default async function SubscriptionPreferencesPage() {
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

  const [{ data: subscriber }, { data: profile }] = await Promise.all([
    supabase
      .from("email_subscribers")
      .select("preferences")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_profiles")
      .select("email_preferences")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const initialPreferences = parsePreferences(
    subscriber?.preferences ?? profile?.email_preferences ?? null,
  );

  return (
    <section className="py-16">
      <Container>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">Email-підписки</h1>
          <Link href="/profile" className="text-sm underline">
            До профілю
          </Link>
        </div>

        <SubscriptionPreferencesForm
          email={user.email ?? "email не вказано"}
          initialPreferences={initialPreferences}
        />
      </Container>
    </section>
  );
}
