import { redirect } from "next/navigation";
import { exportMyDataAction, requestAccountDeletionAction } from "@/actions/profile-data";
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

  const deleteAccount = async () => {
    "use server";
    await requestAccountDeletionAction();
  };

  const exported = await exportMyDataAction();

  return (
    <section className="py-16">
      <Container>
        <h1 className="font-display text-4xl text-[var(--color-text-primary)]">GDPR: мої дані</h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-[var(--color-border)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Експорт даних</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              JSON-експорт ваших даних з акаунта і замовлень.
            </p>
            <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-[var(--color-surface)] p-3 text-xs">
              {JSON.stringify(exported.data ?? { ok: false }, null, 2)}
            </pre>
          </article>

          <article className="rounded-3xl border border-[var(--color-border)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Видалення акаунта
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Натискання кнопки анонімізує ваші персональні дані.
            </p>
            <form action={deleteAccount} className="mt-6">
              <button
                type="submit"
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white"
              >
                Видалити мій акаунт
              </button>
            </form>
          </article>
        </div>
      </Container>
    </section>
  );
}
