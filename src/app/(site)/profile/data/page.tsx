import Link from "next/link";
import { redirect } from "next/navigation";
import { ExportMyDataButton } from "@/components/profile/export-my-data-button";
import { Container } from "@/components/ui/container";
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
    <section className="py-16">
      <Container>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">Мої дані</h1>
          <Link href="/profile" className="text-sm underline">
            До профілю
          </Link>
        </div>

        <div className="max-w-xl space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-8">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Експорт персональних даних
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Ви можете завантажити всі ваші дані: профіль, заявки, замовлення та
            повідомлення у форматі JSON.
          </p>
          <ExportMyDataButton />

          <div className="border-t border-[var(--color-border)] pt-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Видалення акаунта
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Для видалення акаунта перейдіть до налаштувань профілю.
            </p>
            <Link
              href="/profile"
              className="mt-3 inline-block text-sm font-medium text-[var(--color-primary)] underline"
            >
              Перейти до профілю →
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
