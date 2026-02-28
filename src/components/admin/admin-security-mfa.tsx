"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type TotpFactor = {
  id: string;
  status?: string;
};

function toQrSrc(raw: string) {
  if (raw.startsWith("data:")) {
    return raw;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(raw)}`;
}

export function AdminSecurityMfa() {
  const [step, setStep] = useState<"idle" | "setup" | "done">("idle");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasVerifiedFactor, setHasVerifiedFactor] = useState(false);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const loadStatus = async () => {
    const { data, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setError(factorsError.message);
      return;
    }

    const totpFactors = ((data?.totp ?? []) as TotpFactor[]).filter(
      (factor) => factor.status === "verified",
    );

    const verified = totpFactors.length > 0;
    setHasVerifiedFactor(verified);

    if (verified) {
      setStep("done");
      setStatusMessage("2FA вже активна.");
    } else {
      setStep("idle");
      setStatusMessage(null);
    }
  };

  useEffect(() => {
    void loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const startSetup = async () => {
    setLoading(true);
    setError(null);
    setStatusMessage(null);

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Svitlytsya Admin",
    });

    if (enrollError || !data) {
      setError(enrollError?.message ?? "Не вдалося почати налаштування 2FA.");
      setLoading(false);
      return;
    }

    setFactorId(data.id);
    setQrCode(toQrSrc(data.totp.qr_code));
    setStep("setup");
    setLoading(false);
  };

  const verifySetup = async () => {
    if (!factorId) {
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage(null);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError || !challenge) {
      setError(challengeError?.message ?? "Не вдалося створити MFA challenge.");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: token.trim(),
    });

    if (verifyError) {
      setError("Невірний код. Спробуйте ще раз.");
      setLoading(false);
      return;
    }

    setStep("done");
    setStatusMessage("2FA успішно увімкнено.");
    setToken("");
    setLoading(false);
    await loadStatus();
  };

  const disableTwoFactor = async () => {
    const confirmed = window.confirm("Вимкнути 2FA для цього акаунта?");
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage(null);

    const { data, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setError(factorsError.message);
      setLoading(false);
      return;
    }

    const totpFactors = (data?.totp ?? []) as TotpFactor[];

    for (const factor of totpFactors) {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

      if (unenrollError) {
        setError(unenrollError.message);
        setLoading(false);
        return;
      }
    }

    setFactorId(null);
    setQrCode(null);
    setToken("");
    setStep("idle");
    setStatusMessage("2FA вимкнено.");
    setLoading(false);
    await loadStatus();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-secondary)]">
        TOTP-код через Google Authenticator або Authy.
      </p>

      {step === "idle" ? (
        <button
          type="button"
          onClick={() => void startSetup()}
          disabled={loading}
          className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Запуск..." : "Увімкнути 2FA"}
        </button>
      ) : null}

      {step === "setup" && qrCode ? (
        <div className="space-y-3 rounded-2xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            1. Відскануйте QR-код у застосунку аутентифікації.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="MFA QR" className="h-48 w-48 rounded-lg border border-[var(--color-border)]" />

          <label className="block space-y-2">
            <span className="text-sm text-[var(--color-text-secondary)]">2. Введіть 6-значний код</span>
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              maxLength={6}
              inputMode="numeric"
              className="w-full max-w-[220px] rounded-xl border border-[var(--color-border)] px-3 py-2 text-center text-lg tracking-[0.2em]"
            />
          </label>

          <button
            type="button"
            onClick={() => void verifySetup()}
            disabled={loading || token.trim().length < 6}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Перевірка..." : "Підтвердити код"}
          </button>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">2FA активна.</p>
          <button
            type="button"
            onClick={() => void disableTwoFactor()}
            disabled={loading || !hasVerifiedFactor}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
          >
            {loading ? "Вимкнення..." : "Вимкнути 2FA"}
          </button>
        </div>
      ) : null}

      {statusMessage ? <p className="text-sm text-emerald-700">{statusMessage}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
