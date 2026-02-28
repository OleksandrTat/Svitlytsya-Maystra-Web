"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Container } from "@/components/ui/container";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Новий пароль має містити щонайменше 8 символів.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Паролі не збігаються.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.replace("/auth/login?reset=success");
    } catch {
      setError("Не вдалося оновити пароль.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-md rounded-3xl border border-[var(--color-border)] bg-white p-8">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">Новий пароль</h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Введіть новий пароль для вашого акаунту.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-text-secondary)]">Новий пароль</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-text-secondary)]">Підтвердіть пароль</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
              />
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Оновлення..." : "Оновити пароль"}
            </button>
          </form>

          <p className="mt-5 text-sm text-[var(--color-text-secondary)]">
            <Link href="/auth/login" className="text-[var(--color-primary)] underline">
              Повернутись до входу
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
