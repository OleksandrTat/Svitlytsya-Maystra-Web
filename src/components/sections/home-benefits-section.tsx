import { CheckCircle2, Factory, ShieldCheck, WalletCards } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const benefits = [
  {
    title: "Без передоплати до узгодження",
    description: "Спершу технічне рішення та прозорий розрахунок.",
    icon: WalletCards,
  },
  {
    title: "Власне виробництво",
    description: "Контролюємо якість на кожному етапі без посередників.",
    icon: Factory,
  },
  {
    title: "Гарантія 3 роки",
    description: "Офіційні гарантійні зобов'язання на роботи та монтаж.",
    icon: ShieldCheck,
  },
  {
    title: "Консультація безкоштовно",
    description: "Допомагаємо обрати рішення під ваш простір і бюджет.",
    icon: CheckCircle2,
  },
];

export function HomeBenefitsSection() {
  return (
    <section className="bg-[var(--color-surface)] py-14 md:py-20">
      <Container>
        <SectionHeading
          eyebrow="Переваги"
          title="Працюємо так, щоб рішення служили роками"
          description="Ми не продаємо випадкові рішення. Підбираємо матеріали, вузли і монтаж під конкретні умови об'єкта."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item) => (
            <article key={item.title} className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
              <item.icon className="h-6 w-6 text-[var(--color-secondary)]" />
              <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{item.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

