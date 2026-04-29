import type { Metadata } from "next";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Factory, Phone, Shield, Star } from "lucide-react";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { ServicesAccordion } from "@/components/services/services-grid";
import { ServicesPortfolioTabs } from "@/components/services/services-portfolio-tabs";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import { CountUp } from "@/components/ui/count-up";
import { SectionHeading } from "@/components/ui/section-heading";
import { getServices } from "@/lib/data/queries";
import { localizeService } from "@/lib/i18n/content";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const tSp = await getTranslations("servicesPage");
  return {
    title: tSp("metaTitle"),
    description: tSp("metaDescription"),
  };
}

export default async function ServicesPage() {
  const [rawServices, locale, tSp, tCommon, tNav] = await Promise.all([
    getServices(),
    getLocale(),
    getTranslations("servicesPage"),
    getTranslations("common"),
    getTranslations("nav"),
  ]);

  const WHY_US = [
    {
      icon: Shield,
      title: tSp("whyUs.guarantee.title"),
      description: tSp("whyUs.guarantee.description"),
    },
    {
      icon: Factory,
      title: tSp("whyUs.production.title"),
      description: tSp("whyUs.production.description"),
    },
    {
      icon: Star,
      title: tSp("whyUs.experience.title"),
      description: tSp("whyUs.experience.description"),
    },
    {
      icon: Phone,
      title: tSp("whyUs.consultation.title"),
      description: tSp("whyUs.consultation.description"),
    },
  ];
  const services = rawServices.map((s) => localizeService(s, locale as "uk" | "en"));

  return (
    <>
      {/* Hero strip */}
      <section className="relative flex h-[280px] items-end overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?auto=format&fit=crop&w=1920&q=80"
          alt={tSp("workshopAlt")}
          fill
          priority
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(26,10,10,0.92) 40%, rgba(92,26,26,0.60) 100%)",
          }}
        />
        <Container className="relative z-10 pb-10">
          <Breadcrumbs
            items={[
              { label: tCommon("home"), href: "/" },
              { label: tNav("services") },
            ]}
            className="text-white/60 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white/80"
          />
          <h1 className="mt-3 font-display text-4xl font-bold text-white md:text-5xl">
            {tSp("heroTitle")}
          </h1>
          <p className="mt-2 max-w-xl text-base text-white/75">
            {tSp("heroSubtitle")}
          </p>
        </Container>
      </section>

      {/* Intro section */}
      <section className="bg-[var(--color-bg-warm)] py-14 md:py-20">
        <Container>
          <AnimatedSection>
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  {tSp("introEyebrow")}
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-[var(--color-text-primary)] md:text-4xl">
                  {tSp("introTitle")}
                </h2>
                <p className="mt-4 max-w-2xl text-[var(--color-text-secondary)] leading-relaxed">
                  {tSp("introDescription")}
                </p>
              </div>

              <div className="flex flex-row gap-6 lg:flex-col lg:gap-0 lg:divide-y lg:divide-[var(--color-border)]">
                <div className="py-4 lg:pr-4">
                  <p className="font-display text-4xl font-bold text-[var(--color-primary)]">
                    <CountUp end={26} suffix="+" />
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{tSp("statsYears")}</p>
                </div>
                <div className="py-4 lg:pr-4">
                  <p className="font-display text-4xl font-bold text-[var(--color-primary)]">
                    <CountUp end={20000} suffix="+" />
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {tSp("statsProjects")}
                  </p>
                </div>
                <div className="py-4 lg:pr-4">
                  <p className="font-display text-4xl font-bold text-[var(--color-primary)]">
                    <CountUp end={3} />
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {tSp("statsWarranty")}
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </Container>
      </section>

      {/* Accordion section */}
      <section className="py-14 md:py-20">
        <Container>
          <SectionHeading
            eyebrow={tSp("accordionEyebrow")}
            title={tSp("accordionTitle")}
          />
          <ServicesAccordion services={services} className="mt-10" />
        </Container>
      </section>

      {/* Why choose us — dark section */}
      <section className="bg-[var(--color-bg-dark)] py-14 md:py-20">
        <Container>
          <AnimatedSection stagger>
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-0 md:divide-x md:divide-white/10">
              {WHY_US.map((item) => (
                <div key={item.title} className="flex flex-col items-center px-6 text-center">
                  <item.icon size={32} className="text-[var(--color-accent-light)]" />
                  <h3 className="mt-4 font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-white/60">{item.description}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </Container>
      </section>

      {/* Portfolio by service */}
      {services.some((s) => s.gallery.length > 0) && (
        <section className="bg-[var(--color-bg-warm)] py-14 md:py-20">
          <Container>
            <SectionHeading
              eyebrow={tSp("portfolioEyebrow")}
              title={tSp("portfolioTitle")}
            />
            <div className="mt-10">
              <ServicesPortfolioTabs services={services} />
            </div>
          </Container>
        </section>
      )}

      <FinalCtaSection />
    </>
  );
}
