import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Armchair,
  ArrowRight,
  Blinds,
  Factory,
  PanelsTopLeft,
  Phone,
  Shield,
  Star,
  Wrench,
} from "lucide-react";
import { InquiryForm } from "@/components/shared/inquiry-form";
import { Container } from "@/components/ui/container";
import { Stars } from "@/components/ui/stars";
import { PROJECT_CATEGORY_LABELS } from "@/lib/constants";
import {
  getContactSettings,
  getFeaturedProjects,
  getServices,
  getVisibleTestimonials,
} from "@/lib/data/queries";
import type { Project, Service, Testimonial } from "@/lib/types";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Двері, меблі та вікна під ключ",
  description:
    "Svitlytsya Maystra — сімейна майстерня з 26+ роками досвіду. Індивідуальні проєкти дверей, меблів, вікон і реставрація.",
};

const primaryLinkClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)] px-7 text-sm font-semibold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-700)]";

const secondaryLinkClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-on-primary-faint)] px-7 text-sm font-semibold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-700)]";

type ContactSettings = Awaited<ReturnType<typeof getContactSettings>>;

function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[92vh] items-end overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&w=1920&q=80"
        alt="Майстерня Svitlytsya Maystra"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--color-primary-900) 0%, var(--color-primary) 55%, transparent 100%)",
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
        }}
      />

      <Container className="relative z-10 pb-16 pt-32 md:pb-24">
        <div className="max-w-3xl animate-[fadeIn_0.8s_ease_forwards] opacity-0">
          <p className="mb-5 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            <span className="inline-block h-px w-8 bg-[var(--color-accent)]" />
            Майстерня з 1998 року
          </p>

          <h1 className="font-display text-5xl font-bold leading-[1.05] text-[var(--color-on-primary)] md:text-7xl">
            Двері, меблі
            <br />
            <span className="text-[var(--color-accent)]">та вікна</span>
            <br />
            під ключ
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-on-primary-muted)]">
            Сімейна майстерня з 26+ роками досвіду. Кожен виріб — індивідуальний
            проєкт, виготовлений із першокласних матеріалів та з увагою до деталей.
          </p>

          <div className="mt-10 flex flex-wrap gap-8">
            {[
              { value: "26+", label: "років досвіду" },
              { value: "20 000+", label: "проєктів" },
              { value: "3 роки", label: "гарантія" },
            ].map((item) => (
              <div key={item.label}>
                <p className="font-display text-3xl font-bold text-[var(--color-accent)]">
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-[var(--color-on-primary-faint)]">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/catalog" className={primaryLinkClass}>
              Переглянути роботи
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className={secondaryLinkClass}>
              Отримати розрахунок
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function MetricsBar() {
  const items = [
    {
      icon: PanelsTopLeft,
      title: "Двері",
      description: "вхідні та міжкімнатні",
    },
    {
      icon: Armchair,
      title: "Меблі",
      description: "кухні, шафи, стелажі",
    },
    {
      icon: Blinds,
      title: "Вікна",
      description: "ПВХ, алюміній, дерево",
    },
    {
      icon: Wrench,
      title: "Реставрація",
      description: "старих виробів",
    },
  ];

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-warm)]">
      <Container>
        <div className="grid grid-cols-2 divide-x divide-[var(--color-border)] md:grid-cols-4">
          {items.map((item) => (
            <div key={item.title} className="px-4 py-6 text-center md:py-8">
              <item.icon className="mx-auto h-6 w-6 text-[var(--color-accent)]" />
              <p className="mt-3 font-semibold text-[var(--color-text-primary)]">{item.title}</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FeaturedWorksSection({ projects }: { projects: Project[] }) {
  return (
    <section className="section-padding">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Портфоліо
            </p>
            <h2 className="heading-h1 text-[var(--color-text-primary)]">Вибрані роботи</h2>
            <p className="mt-3 body-base text-[var(--color-text-secondary)]">
              Кілька прикладів, щоб відчути рівень виконання. Більше кейсів у
              повному каталозі.
            </p>
          </div>

          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Весь каталог
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Link
              key={project.id}
              href={`/catalog/${project.slug}`}
              className={cn(
                "group relative overflow-hidden rounded-3xl bg-[var(--color-surface)]",
                index === 0 && "sm:col-span-2",
              )}
              style={{ aspectRatio: index === 0 ? "16 / 10" : "4 / 3" }}
            >
              <Image
                src={project.cover_image}
                alt={project.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />

              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "linear-gradient(to top, var(--color-primary) 0%, transparent 75%)",
                }}
              />

              <div className="absolute left-4 top-4">
                <span className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-[var(--color-on-primary)]">
                  {PROJECT_CATEGORY_LABELS[project.category]}
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <div className="rounded-2xl bg-[var(--color-background)] px-4 py-3">
                  <p className="font-semibold text-[var(--color-text-primary)]">{project.title}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {PROJECT_CATEGORY_LABELS[project.category]} · {project.location ?? "Україна"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ServicesSection({ services }: { services: Service[] }) {
  return (
    <section className="section-padding bg-[var(--color-bg-warm)]">
      <Container>
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Що ми робимо
          </p>
          <h2 className="heading-h1 text-[var(--color-text-primary)]">Послуги майстерні</h2>
          <p className="mt-4 body-base text-[var(--color-text-secondary)]">
            Від першого ескізу до монтажу та гарантійного обслуговування.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="group overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-background)] transition hover:-translate-y-1"
            >
              <div className="relative h-52 overflow-hidden">
                {service.cover_image ? (
                  <Image
                    src={service.cover_image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#a4511f,#3b2414)] text-6xl text-white">
                    {service.icon ?? "🚪"}
                  </div>
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, var(--color-primary) 0%, transparent 70%)",
                  }}
                />
              </div>

              <div className="p-6">
                <h3 className="heading-h3 text-[var(--color-text-primary)]">{service.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text-secondary)]">
                  {service.short_description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)] transition group-hover:gap-2">
                  Дізнатись більше
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function BenefitsSection() {
  const items = [
    {
      icon: Shield,
      title: "Гарантія 3 роки",
      description: "Офіційна гарантія на всі роботи та матеріали.",
    },
    {
      icon: Factory,
      title: "Власне виробництво",
      description: "Контролюємо якість на кожному етапі без посередників.",
    },
    {
      icon: Star,
      title: "26+ років досвіду",
      description: "Сімейна майстерня із сталою репутацією.",
    },
    {
      icon: Phone,
      title: "Безкоштовна консультація",
      description: "Допомагаємо обрати рішення під ваш простір і бюджет.",
    },
  ];

  return (
    <section className="section-padding">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Чому обирають нас
            </p>
            <h2 className="heading-h1 text-[var(--color-text-primary)]">
              Якість, яка
              <br />
              говорить сама
            </h2>
            <p className="mt-5 body-base max-w-xl text-[var(--color-text-secondary)]">
              Ми не продаємо шаблонні рішення. Кожен виріб проєктується під
              конкретний простір, а матеріали підбираються індивідуально.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {items.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-100)]">
                    <item.icon className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">{item.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-3xl">
              <Image
                src="https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=900&q=80"
                alt="Деталі виробу"
                width={420}
                height={560}
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative overflow-hidden rounded-3xl">
                <Image
                  src="https://images.unsplash.com/photo-1600566753058-f0b7e7f2f0f5?auto=format&fit=crop&w=900&q=80"
                  alt="Фурнітура та оздоблення"
                  width={420}
                  height={260}
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col items-center justify-center rounded-3xl bg-[var(--color-primary)] p-6 text-center">
                <p className="font-display text-4xl font-bold text-[var(--color-accent)]">
                  20 000+
                </p>
                <p className="mt-2 text-sm text-[var(--color-on-primary-muted)]">
                  реалізованих проєктів
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="section-padding bg-[var(--color-bg-warm)]">
      <Container>
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            Відгуки
          </p>
          <h2 className="heading-h1 text-[var(--color-text-primary)]">Що кажуть клієнти</h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-background)] p-7"
            >
              <Stars rating={item.rating} />
              <blockquote className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">
                “{item.content}”
              </blockquote>
              <footer className="mt-6 border-t border-[var(--color-border)] pt-4">
                <p className="font-semibold text-[var(--color-text-primary)]">{item.author_name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {item.author_location ?? "Україна"}
                </p>
              </footer>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CulturalBlogTeaser() {
  return (
    <section className="section-padding">
      <Container>
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary-900) 0%, var(--color-primary) 100%)",
          }}
        >
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[var(--color-accent-100)] opacity-10" />
          <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-[var(--color-accent-100)] opacity-10" />

          <div className="relative z-10 flex flex-col gap-6 p-10 md:flex-row md:items-center md:justify-between md:p-14">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                Наш блог
              </p>
              <h2 className="heading-h1 text-[var(--color-on-primary)]">Культурний блог</h2>
              <p className="mt-4 body-base text-[var(--color-on-primary-muted)]">
                Есе та розповіді про традиції столярства, архітектурний контекст
                і культуру матеріалу — від авторів і майстрів.
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/cultural"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-7 py-3.5 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-accent-800)] hover:text-[var(--color-on-primary)]"
              >
                Читати блог
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ContactCtaSection({ contacts }: { contacts: ContactSettings }) {
  return (
    <section className="section-padding bg-[var(--color-primary)]">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Консультація
            </p>
            <h2 className="heading-h1 text-[var(--color-on-primary)]">
              Розкажіть про
              <br />
              вашу задачу
            </h2>
            <p className="mt-5 body-base max-w-md text-[var(--color-on-primary-muted)]">
              Вартість визначається після консультації та уточнення матеріалів,
              термінів і деталей монтажу. Відповідаємо у робочий час.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { label: "Телефон", value: contacts.phone },
                { label: "Email", value: contacts.email },
                { label: "Графік", value: contacts.hours },
              ].map((item) => (
                <div key={item.label} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                    {item.label}
                  </span>
                  <span className="text-sm text-[var(--color-on-primary-muted)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-primary-500)] bg-[var(--color-background)] p-8">
            <h3 className="font-display text-2xl text-[var(--color-text-primary)]">Форма заявки</h3>
            <InquiryForm compact className="mt-6" />
          </div>
        </div>
      </Container>
    </section>
  );
}

export default async function HomePage() {
  const [featuredProjects, testimonials, services, contacts] = await Promise.all([
    getFeaturedProjects(6),
    getVisibleTestimonials(3),
    getServices(),
    getContactSettings(),
  ]);

  return (
    <>
      <HeroSection />
      <MetricsBar />
      <FeaturedWorksSection projects={featuredProjects} />
      <ServicesSection services={services} />
      <BenefitsSection />
      <TestimonialsSection testimonials={testimonials} />
      <CulturalBlogTeaser />
      <ContactCtaSection contacts={contacts} />
    </>
  );
}
