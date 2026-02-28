"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
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
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-md rounded-3xl border border-[var(--color-border)] bg-white p-8">
          <h1 className="font-display text-3xl text-[var(--color-text-primary)]">Відновлення пароля</h1>

          {sent ? (
            <div className="mt-4 space-y-3">
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Лист для скидання пароля надіслано.
              </p>
              <Link href="/auth/login" className="text-sm text-[var(--color-primary)] underline">
                Повернутись до входу
              </Link>
            </div>
          ) : (
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

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Надсилання..." : "Надіслати посилання"}
              </button>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
