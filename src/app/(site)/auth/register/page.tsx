"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordHint = useMemo(() => {
    if (!password) {
      return null;
    }
    if (password.length < 8) {
      return "Мінімум 8 символів.";
    }
    return null;
  }, [password]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setError("Імʼя має містити щонайменше 2 символи.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Вкажіть коректний email.");
      return;
    }

    if (password.length < 8) {
      setError("Пароль має містити щонайменше 8 символів.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Паролі не збігаються.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { display_name: trimmedName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      router.replace(`/auth/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
    } catch {
      setError("Не вдалося завершити реєстрацію. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-md rounded-3xl border border-[var(--color-border)] bg-white p-8">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">Реєстрація</h1>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-text-secondary)]">Імʼя</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
              />
            </label>

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
                minLength={8}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
              />
              {passwordHint ? <p className="text-xs text-amber-700">{passwordHint}</p> : null}
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
              {loading ? "Реєстрація..." : "Створити акаунт"}
            </button>
          </form>

          <p className="mt-5 text-sm text-[var(--color-text-secondary)]">
            Уже маєте акаунт?{" "}
            <Link href="/auth/login" className="text-[var(--color-primary)] underline">
              Увійти
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
