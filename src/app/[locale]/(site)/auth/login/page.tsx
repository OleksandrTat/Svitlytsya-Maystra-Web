"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FormEvent, Suspense, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Link, useRouter } from "@/i18n/navigation";
import { isAdminUser } from "@/lib/auth/is-admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function LoginPageContent() {
  const t = useTranslations("auth.loginPage");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextParam = searchParams.get("next");
  const safeNext = nextParam && nextParam.startsWith("/") ? nextParam : null;
  const justReset = searchParams.get("reset") === "success";
  const callbackError = searchParams.get("error") === "auth_callback";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(t("errorInvalidCredentials"));
        return;
      }

      const isAdmin = isAdminUser(data.user);
      let target: string = isAdmin ? "/admin" : "/profile";

      if (safeNext) {
        target = safeNext.startsWith("/admin") && !isAdmin ? "/profile" : safeNext;
      }

      // For `/admin` the locale prefix is not used (admin is locale-less).
      // For everything else (including /profile) we rely on `useRouter` from
      // `@/i18n/navigation` which auto-prepends the active locale.
      if (target.startsWith("/admin")) {
        window.location.assign(target);
      } else {
        // `next` may already contain a locale prefix (e.g. /uk/profile)
        // — strip it so next-intl's router doesn't double-prefix it.
        const unlocalised = target.replace(/^\/(uk|en)(?=\/|$)/, "") || "/";
        router.replace(unlocalised);
        router.refresh();
      }
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div>
        <h1 className="font-display text-[32px] font-semibold text-[var(--color-text-primary)]">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {t("noAccountQuestion")}{" "}
          <Link
            href="/auth/register"
            className="font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-700)]"
          >
            {t("goToRegister")}
          </Link>
        </p>
      </div>

      {justReset && (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {t("passwordResetSuccess")}
        </div>
      )}

      {callbackError && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("errorCallback")}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
            {tAuth("email")}
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t("emailPlaceholder")}
            className="mt-1.5 block w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-shadow placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
          />
        </label>

        <label className="block">
          <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
            {tAuth("password")}
          </span>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t("passwordPlaceholder")}
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

        <div className="text-right">
          <Link
            href="/auth/forgot-password"
            className="text-[13px] font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-700)]"
          >
            {tAuth("forgotPassword")}
          </Link>
        </div>

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
          {loading ? t("submitting") : t("submit")}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
