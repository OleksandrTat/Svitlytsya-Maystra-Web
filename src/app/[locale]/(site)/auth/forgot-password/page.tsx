"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError("Не вдалося надіслати лист для відновлення.");
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
              <Mail size={24} className="text-[var(--color-primary)]" />
            </span>
          </div>

          <h1 className="mt-5 text-center font-display text-[28px] font-semibold text-[var(--color-text-primary)]">
            Відновлення пароля
          </h1>
          <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
            Вкажіть email, і ми надішлемо посилання для скидання пароля
          </p>

          {sent ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
                Лист для скидання пароля надіслано на <strong>{email}</strong>
              </div>
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-700)]"
                >
                  &larr; Повернутись до входу
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <label className="block">
                <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
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
                {loading ? "Надсилання..." : "Надіслати посилання"}
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
          )}
        </div>
      </Container>
    </section>
  );
}
