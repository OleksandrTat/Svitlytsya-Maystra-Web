import Link from "next/link";
import { Mail } from "lucide-react";
import { Container } from "@/components/ui/container";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : null;

  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-16">
      <Container>
        <div className="mx-auto max-w-[440px] rounded-2xl border border-[var(--color-border)] bg-white p-10 text-center shadow-sm">
          <div className="flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-100)]">
              <Mail size={28} className="text-[var(--color-primary)]" />
            </span>
          </div>

          <h1 className="mt-5 font-display text-[28px] font-semibold text-[var(--color-text-primary)]">
            Перевірте пошту
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Ми надіслали посилання для підтвердження
            {email && (
              <>
                {" "}
                на <strong className="text-[var(--color-text-primary)]">{email}</strong>
              </>
            )}
            . Після переходу за ним ви будете автоматично авторизовані.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="flex h-11 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)]"
            >
              Увійти
            </Link>
            <Link
              href="/"
              className="flex h-11 items-center justify-center rounded-full border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-warm)]"
            >
              На головну
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
