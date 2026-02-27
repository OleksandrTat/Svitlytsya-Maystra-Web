import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getServices } from "@/lib/data/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Послуги",
  description:
    "Двері на замовлення, меблі, ПВХ вікна та реставрація. Вартість визначається індивідуально після консультації.",
};

const process = [
  "Запит",
  "Консультація",
  "Дизайн",
  "Виробництво",
  "Монтаж",
  "Гарантія",
];

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <section className="py-14 md:py-20">
        <Container>
          <SectionHeading
            eyebrow="Послуги"
            title="Рішення для дверей, меблів, вікон і реставрації"
            description="Працюємо під конкретну задачу: без шаблонних кошторисів, з прозорим процесом та персональними рекомендаціями."
          />

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {services.map((service) => (
              <article key={service.id} className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">
                <div className="relative h-52">
                  <Image
                    src={service.cover_image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="space-y-3 p-5">
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{service.title}</h2>
                  <p className="text-sm leading-7 text-[var(--color-text-secondary)]">{service.short_description}</p>
                  <Link href={`/services/${service.slug}`} className="text-sm font-semibold text-[var(--color-primary)]">
                    Дізнатись більше
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-[var(--color-surface)] py-14 md:py-20">
        <Container>
          <SectionHeading
            eyebrow="Процес роботи"
            title="Від першого звернення до гарантійного супроводу"
            description="Кожен етап узгоджується з вами. Фіксованих цін на сайті немає: вартість визначається індивідуально після консультації."
          />

          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {process.map((step, index) => (
              <li key={step} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-secondary)]">Крок {index + 1}</p>
                <p className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">{step}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <FinalCtaSection />
    </>
  );
}

