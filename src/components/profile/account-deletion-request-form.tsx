"use client";

import { useState } from "react";
import { requestAccountDeletionAction } from "@/actions/profile-data";
import { Button } from "@/components/ui/button";

export function AccountDeletionRequestForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const result = await requestAccountDeletionAction();

    if (!result.ok) {
      setError(result.message);
    } else {
      setMessage(result.message);
    }

    setSubmitting(false);
  };

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-white p-8">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Запит на видалення акаунта</h2>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Акаунт не видаляється миттєво. Після натискання ми створимо запит для адміністратора на ручну перевірку
        та обробку.
      </p>

      <div className="mt-5">
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={submitting}
          onClick={() => {
            void onSubmit();
          }}
        >
          {submitting ? "Надсилання..." : "Запросити видалення акаунта"}
        </Button>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
    </section>
  );
}
