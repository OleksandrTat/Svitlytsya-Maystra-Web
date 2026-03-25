import type { Metadata } from "next";
import Image from "next/image";
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

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Послуги майстерні",
  description:
    "Двері на замовлення, меблі, вікна та реставрація. Від першого ескізу до монтажу — беремо на себе весь процес.",
};

const WHY_US = [
  {
    icon: Shield,
    title: "Гарантія 3 роки",
    description: "На всі види робіт та матеріали",
  },
  {
    icon: Factory,
    title: "Власне виробництво",
    description: "Повний цикл — від проєкту до монтажу",
  },
  {
    icon: Star,
    title: "26+ років досвіду",
    description: "Працюємо з 1998 року",
  },
  {
    icon: Phone,
    title: "Безкоштовна консультація",
    description: "Допоможемо обрати рішення під ваш бюджет",
  },
];

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      {/* Hero strip */}
      <section className="relative flex h-[280px] items-end overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?auto=format&fit=crop&w=1920&q=80"
          alt="Майстерня"
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
              { label: "Головна", href: "/" },
              { label: "Послуги" },
            ]}
            className="text-white/60 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white/80"
          />
          <h1 className="mt-3 font-display text-4xl font-bold text-white md:text-5xl">
            Послуги майстерні
          </h1>
          <p className="mt-2 max-w-xl text-base text-white/75">
            Від першого ескізу до монтажу — беремо на себе весь процес
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
                  Як ми працюємо
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold text-[var(--color-text-primary)] md:text-4xl">
                  Кожен проєкт — індивідуальне рішення
                </h2>
                <p className="mt-4 max-w-2xl text-[var(--color-text-secondary)] leading-relaxed">
                  Ми не продаємо шаблонних рішень. Спочатку розбираємось у вашій задачі, потім
                  пропонуємо матеріали, конструкцію і строки. Працюємо під конкретну задачу: без
                  шаблонних кошторисів, з прозорим процесом та персональними рекомендаціями.
                </p>
              </div>

              <div className="flex flex-row gap-6 lg:flex-col lg:gap-0 lg:divide-y lg:divide-[var(--color-border)]">
                <div className="py-4 lg:pr-4">
                  <p className="font-display text-4xl font-bold text-[var(--color-primary)]">
                    <CountUp end={26} suffix="+" />
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">Років досвіду</p>
                </div>
                <div className="py-4 lg:pr-4">
                  <p className="font-display text-4xl font-bold text-[var(--color-primary)]">
                    <CountUp end={20000} suffix="+" />
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Реалізованих проєктів
                  </p>
                </div>
                <div className="py-4 lg:pr-4">
                  <p className="font-display text-4xl font-bold text-[var(--color-primary)]">
                    <CountUp end={3} />
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    Роки гарантії на всі роботи
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
            eyebrow="Наші послуги"
            title="Від консультації до монтажу"
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
              eyebrow="Портфоліо"
              title="Приклади наших робіт"
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
