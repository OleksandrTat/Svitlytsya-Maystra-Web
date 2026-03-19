import type { Metadata } from "next";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { ServicesGrid } from "@/components/services/services-grid";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getServices } from "@/lib/data/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Послуги",
  description:
    "Двері на замовлення, меблі, вікна та реставрація. Вартість визначається індивідуально після консультації.",
};

const process = ["Запит", "Консультація", "Дизайн", "Виробництво", "Монтаж", "Гарантія"];

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

          <ServicesGrid services={services} className="mt-10" />
        </Container>
      </section>

      <section className="bg-[var(--color-surface)] py-14 md:py-20">
        <Container>
          <SectionHeading
            eyebrow="Процес роботи"
            title="Від першого звернення до гарантійного супроводу"
            description="Кожен етап узгоджується з вами. Вартість визначається індивідуально після консультації."
          />

          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {process.map((step, index) => (
              <li key={step} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-secondary)]">
                  Крок {index + 1}
                </p>
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
