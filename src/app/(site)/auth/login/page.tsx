"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Container } from "@/components/ui/container";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get("next") || "/profile";
  const justReset = searchParams.get("reset") === "success";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("Невірний email або пароль.");
        return;
      }

      router.replace(redirectTo.startsWith("/") ? redirectTo : "/profile");
      router.refresh();
    } catch {
      setError("Не вдалося виконати вхід. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-md rounded-3xl border border-[var(--color-border)] bg-white p-8">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">Увійти</h1>

          {justReset ? (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Пароль оновлено. Увійдіть з новим паролем.
            </p>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-text-secondary)]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-text-secondary)]">Пароль</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
              />
            </label>

            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-sm text-[var(--color-primary)] underline">
                Забули пароль?
              </Link>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Вхід..." : "Увійти"}
            </button>
          </form>

          <p className="mt-5 text-sm text-[var(--color-text-secondary)]">
            Немає акаунту?{" "}
            <Link href="/auth/register" className="text-[var(--color-primary)] underline">
              Зареєструватись
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
