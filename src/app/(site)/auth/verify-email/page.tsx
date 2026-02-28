import Link from "next/link";
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
    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-xl rounded-3xl border border-[var(--color-border)] bg-white p-8 text-center">
          <p className="text-5xl" aria-hidden>
            ✉
          </p>
          <h1 className="mt-4 font-display text-3xl text-[var(--color-text-primary)]">
            Підтвердіть email
          </h1>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Ми надіслали посилання для підтвердження{email ? ` на ${email}` : ""}. Після переходу за
            ним ви будете автоматично авторизовані.
          </p>

          <div className="mt-6 flex justify-center gap-4 text-sm">
            <Link href="/auth/login" className="text-[var(--color-primary)] underline">
              Увійти
            </Link>
            <Link href="/" className="text-[var(--color-text-secondary)] underline">
              На головну
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
