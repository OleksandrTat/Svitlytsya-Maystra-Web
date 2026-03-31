"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MailX, Loader2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { unsubscribeFromNewsletterAction } from "@/actions/newsletter";

export function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleUnsubscribe = async () => {
    if (!email) return;
    setLoading(true);
    await unsubscribeFromNewsletterAction(email);
    setLoading(false);
    setDone(true);
  };

  return (
    <section className="py-20 md:py-32">
      <Container size="narrow">
        <div className="mx-auto max-w-md text-center">
          {done ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 size={48} className="text-emerald-500" />
              <h1 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
                Ви відписались
              </h1>
              <p className="text-[var(--color-text-secondary)]">
                Email <strong>{email}</strong> було успішно відписано від
                розсилки.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <MailX size={48} className="text-[var(--color-text-muted)]" />
              <h1 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
                Відписка від розсилки
              </h1>
              {email ? (
                <>
                  <p className="text-[var(--color-text-secondary)]">
                    Ви дійсно хочете відписати{" "}
                    <strong>{email}</strong> від нашої розсилки?
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleUnsubscribe()}
                    disabled={loading}
                    className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-8 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Підтвердити відписку"
                    )}
                  </button>
                </>
              ) : (
                <p className="text-[var(--color-text-muted)]">
                  Не вказано email для відписки.
                </p>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
