import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const metrics = [
  { value: "26+", label: "років досвіду" },
  { value: "20 000+", label: "реалізованих проєктів" },
  { value: "100%", label: "індивідуальний підхід" },
];

export function HomeAboutSection() {
  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="relative h-[360px] overflow-hidden rounded-3xl">
            <Image
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"
              alt="Майстер у цеху"
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-8">
            <SectionHeading
              eyebrow="Про майстерню"
              title="Сімейна традиція, яка працює на ваш комфорт"
              description="Ми поєднуємо ремісничу уважність і сучасну точність виробництва. Кожен виріб проходить внутрішню перевірку якості перед монтажем."
            />

            <div className="grid gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <p className="font-display text-2xl text-[var(--color-primary)]">{metric.value}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

