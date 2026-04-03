import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { ExportMyDataButton } from "@/components/profile/export-my-data-button";
import { ProfileLayout } from "@/components/layout/profile-layout";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfileDataPage() {
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

  return (
    <>
      <PageHero
        title="Мої дані"
        breadcrumbs={[
          { label: "Головна", href: "/" },
          { label: "Профіль", href: "/profile" },
          { label: "Мої дані" },
        ]}
        height="h-[180px]"
      />
      <ProfileLayout>
        <div className="max-w-xl space-y-6">
          {/* Export */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-100)]">
                <Download size={18} className="text-[var(--color-primary)]" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
                  Експорт персональних даних
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Завантажте всі ваші дані: профіль, заявки, замовлення та повідомлення у форматі
                  JSON.
                </p>
                <div className="mt-4">
                  <ExportMyDataButton />
                </div>
              </div>
            </div>
          </div>

          {/* Deletion */}
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={18} className="text-red-600" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-red-900">
                  Видалення акаунта
                </h2>
                <p className="mt-1 text-sm text-red-700/70">
                  Для видалення акаунта перейдіть до налаштувань профілю.
                </p>
                <Link
                  href="/profile"
                  className="mt-3 inline-flex items-center text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-700)]"
                >
                  Перейти до профілю &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ProfileLayout>
    </>
  );
}
