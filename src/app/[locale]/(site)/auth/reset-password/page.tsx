"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Container } from "@/components/ui/container";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-16">
      <Container>
        <div className="mx-auto max-w-[440px] rounded-2xl border border-[var(--color-border)] bg-white p-10 shadow-sm">
          <div className="flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-100)]">
              <KeyRound size={24} className="text-[var(--color-primary)]" />
            </span>
          </div>

          <h1 className="mt-5 text-center font-display text-[28px] font-semibold text-[var(--color-text-primary)]">
            Новий пароль
          </h1>
          <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
            Введіть новий пароль для вашого акаунту
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <label className="block">
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
                Новий пароль
              </span>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Мінімум 8 символів"
                  className="block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 pr-11 text-sm text-[var(--color-text-primary)] outline-none transition-shadow placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
                Підтвердіть пароль
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Повторіть пароль"
                className="mt-1.5 block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-shadow placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
              />
            </label>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)] disabled:opacity-60"
            >
              {loading ? "Оновлення..." : "Оновити пароль"}
            </button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-700)]"
              >
                &larr; Повернутись до входу
              </Link>
            </div>
          </form>
        </div>
      </Container>
    </section>
  );
}
