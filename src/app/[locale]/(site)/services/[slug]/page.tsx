import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getLocale, getTranslations } from "next-intl/server";
import { getServiceBySlug, getServices } from "@/lib/data/queries";
import { localizeService } from "@/lib/i18n/content";

export const revalidate = 3600;

type Params = { slug: string };

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  const t = await getTranslations("servicePage");

  if (!service) {
    return { title: t("notFound") };
  }

  const locale = await getLocale();
  const localizedService = localizeService(service, locale as "uk" | "en");

  return {
    title: localizedService.seo_title || localizedService.title,
    description: localizedService.seo_description || localizedService.short_description,
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const locale = await getLocale();
  const t = await getTranslations("servicePage");
  const localizedService = localizeService(service, locale as "uk" | "en");

  const galleryImages = service.gallery.filter(
    (src) => src.startsWith("http") || src.startsWith("/"),
  );

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-end overflow-hidden">
        {service.cover_image ? (
          <Image
            src={service.cover_image}
            alt={localizedService.title}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]" />
        )}
        <div className="absolute inset-0 bg-[rgba(26,10,10,0.75)]" />
        <Container className="relative z-10 pb-14 pt-20">
          {service.category && (
            <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white">
              {service.category}
            </span>
          )}
          <h1 className="mt-4 font-display text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            {localizedService.title}
          </h1>
          {localizedService.tagline && (
            <p className="mt-3 max-w-xl text-lg italic text-white/70">{localizedService.tagline}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            {service.price_from && (
              <span className="rounded-full border border-white/30 px-4 py-1.5 text-sm text-white">
                від {service.price_from.toLocaleString("uk-UA")} {service.price_unit ?? "грн"}
              </span>
            )}
            {service.duration_days_from && (
              <span className="rounded-full border border-white/30 px-4 py-1.5 text-sm text-white">
                {service.duration_days_from}–{service.duration_days_to ?? service.duration_days_from} {t("days")}
              </span>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-white/90"
            >
              {t("orderButton")}
            </Link>
            <a
              href="#process"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t("processButton")}
            </a>
          </div>
        </Container>
      </section>

      {/* About section (split) */}
      <section className="py-14 md:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[55%_45%]">
            <div>
              <SectionHeading
                eyebrow={t("aboutEyebrow")}
                title={localizedService.title}
              />
              <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-secondary)]">
                {localizedService.description}
              </p>
              {service.features.length > 0 && (
                <div className="mt-8 space-y-3">
                  {service.features.map((feature) => (
                    <div key={feature.title} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                        <Check size={12} />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {feature.title}
                        </p>
                        {feature.description && (
                          <p className="text-sm text-[var(--color-text-muted)]">
                            {feature.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Photo grid */}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {galleryImages.slice(0, 4).map((src, i) => (
                  <div
                    key={src}
                    className="relative aspect-square overflow-hidden rounded-xl"
                  >
                    <Image
                      src={src}
                      alt={`${localizedService.title} — фото ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Process section */}
      {service.process_steps.length > 0 && (
        <section id="process" className="scroll-mt-20 bg-[var(--color-bg-dark)] py-14 md:py-20">
          <Container>
            <SectionHeading
              eyebrow={t("processEyebrow")}
              title={t("processTitle")}
            />
            <AnimatedSection stagger className="mt-10">
              <div className="space-y-0">
                {service.process_steps.map((step, index) => (
                  <div key={`${step.step}-${step.title}`} className="relative flex gap-6 pb-8 last:pb-0">
                    {/* Vertical line */}
                    {index < service.process_steps.length - 1 && (
                      <div className="absolute left-[15px] top-10 h-[calc(100%-24px)] w-px bg-white/10" />
                    )}
                    {/* Step circle */}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-accent-light)] font-display text-sm font-bold text-[var(--color-accent-light)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{step.title}</h3>
                      {step.description && (
                        <p className="mt-1 text-sm text-white/60">{step.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </Container>
        </section>
      )}

      {/* Gallery section */}
      {galleryImages.length > 4 && (
        <section className="bg-[var(--color-bg-warm)] py-14 md:py-20">
          <Container>
            <SectionHeading eyebrow={t("portfolioEyebrow")} title={t("portfolioTitle")} />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl transition-transform duration-300 hover:scale-[1.02]"
                >
                  <Image
                    src={src}
                    alt={`${localizedService.title} — робота ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Pricing card */}
      {service.price_from && (
        <section className="py-14 md:py-20">
          <Container>
            <div className="mx-auto max-w-2xl rounded-2xl border-l-4 border-[var(--color-primary)] bg-[var(--color-bg-warm)] p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                {t("priceLabel")}
              </p>
              <p className="mt-2 font-display text-4xl font-bold text-[var(--color-primary)]">
                від {service.price_from.toLocaleString("uk-UA")} {service.price_unit ?? "грн"}
              </p>
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                {t("priceNote")}
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-flex rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)]"
              >
                {t("getQuote")}
              </Link>
            </div>
          </Container>
        </section>
      )}

      <FinalCtaSection />
    </>
  );
}
