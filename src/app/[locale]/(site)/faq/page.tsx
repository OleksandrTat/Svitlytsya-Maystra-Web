import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { getPublishedFaqByCategory, getFaqCategoryLabels } from "@/lib/data/faq-queries";
import { FaqAccordion } from "@/components/faq/faq-accordion";
import { localizeFaqItem } from "@/lib/i18n/content";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("faq");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}


const CATEGORY_ORDER = [
  "general",
  "production",
  "delivery",
  "warranty",
  "payment",
];

export default async function FaqPage() {
  const [t, tFaq, tCommon, locale, faqByCategory, customLabels] = await Promise.all([
    getTranslations("faq"),
    getTranslations("faqPage"),
    getTranslations("common"),
    getLocale(),
    getPublishedFaqByCategory(),
    getFaqCategoryLabels(),
  ]);

  const localizedByCategory = Object.fromEntries(
    Object.entries(faqByCategory).map(([cat, items]) => [
      cat,
      items.map((item) => localizeFaqItem(item, locale as "uk" | "en")),
    ]),
  );

  const sortedCategories = Object.keys(localizedByCategory).sort(
    (a, b) =>
      (CATEGORY_ORDER.indexOf(a) === -1 ? 99 : CATEGORY_ORDER.indexOf(a)) -
      (CATEGORY_ORDER.indexOf(b) === -1 ? 99 : CATEGORY_ORDER.indexOf(b)),
  );

  return (
    <>
      <PageHero
        title="FAQ"
        subtitle={t("subtitle")}
        breadcrumbs={[
          { label: tCommon("home"), href: "/" },
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
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {customLabels[category]?.[locale as "uk" | "en"]
                      ?? (tFaq.has(`categories.${category}` as any) ? tFaq(`categories.${category}` as any) : null)
                      ?? category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ")}
                  </h2>
                  <FaqAccordion items={localizedByCategory[category]!} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="font-display text-2xl text-[var(--color-text-primary)]">
                {t("noItems")}
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-warm)] p-8 text-center md:p-12">
            <h3 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
              {t("cta")}
            </h3>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              {t("ctaDesc")}
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-8 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]"
            >
              {t("ctaButton")}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
