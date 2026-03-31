import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { getPublishedFaqByCategory } from "@/lib/data/faq-queries";
import { FaqAccordion } from "@/components/faq/faq-accordion";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Поширені запитання",
  description:
    "Відповіді на найпоширеніші запитання про наші послуги, доставку, гарантію та оплату.",
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "Загальні питання",
  production: "Виробництво",
  delivery: "Доставка та монтаж",
  warranty: "Гарантія та обслуговування",
  payment: "Оплата",
};

const CATEGORY_ORDER = [
  "general",
  "production",
  "delivery",
  "warranty",
  "payment",
];

export default async function FaqPage() {
  const faqByCategory = await getPublishedFaqByCategory();

  const sortedCategories = Object.keys(faqByCategory).sort(
    (a, b) =>
      (CATEGORY_ORDER.indexOf(a) === -1 ? 99 : CATEGORY_ORDER.indexOf(a)) -
      (CATEGORY_ORDER.indexOf(b) === -1 ? 99 : CATEGORY_ORDER.indexOf(b)),
  );

  return (
    <>
      <PageHero
        title="FAQ"
        subtitle="Поширені запитання"
        breadcrumbs={[
          { label: "Головна", href: "/" },
          { label: "FAQ" },
        ]}
      />

      <section className="py-14 md:py-20">
        <Container size="narrow">
          {sortedCategories.length > 0 ? (
            <div className="space-y-12">
              {sortedCategories.map((category) => (
                <div key={category}>
                  <h2 className="mb-6 font-display text-2xl font-semibold text-[var(--color-text-primary)]">
                    {CATEGORY_LABELS[category] ?? category}
                  </h2>
                  <FaqAccordion items={faqByCategory[category]} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="font-display text-2xl text-[var(--color-text-primary)]">
                Поки що немає запитань
              </p>
              <p className="text-[var(--color-text-muted)]">
                Зверніться до нас напряму
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-warm)] p-8 text-center md:p-12">
            <h3 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
              Не знайшли відповідь?
            </h3>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              Зв&apos;яжіться з нами і ми з радістю допоможемо
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-8 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]"
            >
              Зв&apos;язатись
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
