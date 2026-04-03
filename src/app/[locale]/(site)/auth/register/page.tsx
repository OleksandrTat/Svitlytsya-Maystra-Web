"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: "Слабкий", color: "bg-red-400" };
  if (score <= 2) return { level: 2, label: "Середній", color: "bg-amber-400" };
  if (score <= 3) return { level: 3, label: "Добрий", color: "bg-emerald-400" };
  return { level: 4, label: "Надійний", color: "bg-emerald-600" };
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const prefilledEmail = searchParams.get("email") ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  const passwordHint = useMemo(() => {
    if (!password) return null;
    if (password.length < 8) return "Мінімум 8 символів.";
    return null;
  }, [password]);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setError("Ім'я має містити щонайменше 2 символи.");
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

      if (inviteToken) {
        await fetch("/api/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inviteToken }),
        });
      }

      router.replace(`/auth/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
    } catch {
      setError("Не вдалося завершити реєстрацію. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <h1 className="font-display text-[32px] font-semibold text-[var(--color-text-primary)]">
          Реєстрація
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Уже маєте акаунт?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-700)]"
          >
            Увійти &rarr;
          </Link>
        </p>
      </div>

      {inviteToken && (
        <div className="mt-4 rounded-xl border-l-4 border-[var(--color-primary)] bg-[var(--color-primary-100)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          Вас запрошено до особистого кабінету. Перевірте email та завершіть реєстрацію.
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
            Ім&rsquo;я
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ваше ім'я"
            className="mt-1.5 block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-shadow placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
          />
        </label>

        <label className="block">
          <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            className="mt-1.5 block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-shadow placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
          />
        </label>

        <div>
          <label className="block">
            <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
              Пароль
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
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= strength.level ? strength.color : "bg-[var(--color-border)]"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                {passwordHint ?? strength.label}
              </p>
            </div>
          )}
        </div>

        <label className="block">
          <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
            Підтвердьте пароль
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
          {loading ? "Реєстрація..." : "Створити акаунт"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}
