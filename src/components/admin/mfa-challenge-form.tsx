"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function MfaChallengeForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setError(null);
    setLoading(true);

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setError(factorsError.message);
      setLoading(false);
      return;
    }

    const totp = factors?.totp?.find(
      (factor: { id: string; status?: string }) => factor.status === "verified",
    );
    if (!totp) {
      router.replace("/admin/settings");
      router.refresh();
      return;
    }

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: totp.id,
    });
    if (challengeError || !challenge) {
      setError(challengeError?.message ?? "Не вдалося почати перевірку.");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: totp.id,
      challengeId: challenge.id,
      code: code.trim(),
    });

    if (verifyError) {
      setError("Невірний код.");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-sm rounded-3xl border border-[var(--color-border)] bg-white p-8">
      <h1 className="font-display text-2xl text-[var(--color-text-primary)]">Підтвердження 2FA</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Введіть код з Google Authenticator або Authy.
      </p>

      <div className="mt-5 space-y-3">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          maxLength={6}
          inputMode="numeric"
          placeholder="000000"
          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-center text-2xl tracking-[0.24em]"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          onClick={() => void verify()}
          disabled={loading || code.trim().length < 6}
          className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Перевірка..." : "Підтвердити"}
        </button>
      </div>
    </div>
  );
}
