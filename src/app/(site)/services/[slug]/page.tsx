import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getServiceBySlug, getServices } from "@/lib/data/queries";

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

  if (!service) {
    return { title: "РџРѕСЃР»СѓРіСѓ РЅРµ Р·РЅР°Р№РґРµРЅРѕ" };
  }

  return {
    title: service.seo_title || service.title,
    description: service.seo_description || service.short_description,
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

  return (
    <>
      <section className="py-14 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="relative h-[360px] overflow-hidden rounded-3xl">
              {service.cover_image ? (
                <Image src={service.cover_image} alt={service.title} fill className="object-cover" priority />
              ) : (
                <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#a4511f,#3b2414)] text-7xl text-white">
                  {service.icon ?? "рџљЄ"}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <h1 className="font-display text-4xl text-[var(--color-text-primary)]">{service.title}</h1>
              {service.tagline ? (
                <p className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--color-primary)]">
                  {service.tagline}
                </p>
              ) : null}
              <p className="text-[var(--color-text-secondary)]">{service.description}</p>

              <div className="flex flex-wrap gap-3">
                {service.price_from ? (
                  <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-secondary)]">
                    Р’Р°СЂС‚С–СЃС‚СЊ РІС–Рґ {service.price_from.toLocaleString("uk-UA")} {service.price_unit ?? "РіСЂРЅ"}
                  </p>
                ) : (
                  <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-secondary)]">
                    Р’Р°СЂС‚С–СЃС‚СЊ РІРёР·РЅР°С‡Р°С”С‚СЊСЃСЏ С–РЅРґРёРІС–РґСѓР°Р»СЊРЅРѕ РїС–СЃР»СЏ РєРѕРЅСЃСѓР»СЊС‚Р°С†С–С—.
                  </p>
                )}

                {service.duration_days_from ? (
                  <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-secondary)]">
                    РћСЂС–С”РЅС‚РѕРІРЅРёР№ С‚РµСЂРјС–РЅ: {service.duration_days_from}-{service.duration_days_to ?? service.duration_days_from} РґРЅС–РІ
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/contact" className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white">
                  Р—Р°РјРѕРІРёС‚Рё
                </Link>
                <Link href="/contact" className="rounded-full border border-[var(--color-border)] px-6 py-3 text-sm text-[var(--color-text-secondary)]">
                  РћС‚СЂРёРјР°С‚Рё СЂРѕР·СЂР°С…СѓРЅРѕРє
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {service.process_steps.length > 0 ? (
        <section className="bg-[var(--color-surface)] py-14 md:py-20">
          <Container>
            <SectionHeading title="РџСЂРѕС†РµСЃ" />
            <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {service.process_steps.map((step, index) => (
                <li key={`${step.step}-${step.title}`} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-secondary)]">
                    Р•С‚Р°Рї {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">{step.title}</p>
                  {step.description ? (
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{step.description}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </Container>
        </section>
      ) : null}

      {service.features.length > 0 ? (
        <section className="py-14 md:py-20">
          <Container>
            <SectionHeading title="РџРµСЂРµРІР°РіРё СЃРµСЂРІС–СЃСѓ" />
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {service.features.map((feature) => (
                <article key={feature.title} className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                  <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{feature.title}</h2>
                  {feature.description ? (
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{feature.description}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <FinalCtaSection />
    </>
  );
}
