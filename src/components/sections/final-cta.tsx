import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { InquiryForm } from "@/components/shared/inquiry-form";

export function FinalCtaSection() {
  return (
    <section className="bg-[var(--color-primary)] py-14 md:py-20">
      <Container>
        <div className="grid gap-8 rounded-3xl bg-white/5 p-6 md:grid-cols-[1.1fr_1fr] md:p-10">
          <SectionHeading
            eyebrow="Консультація"
            title="Опишіть задачу і ми підготуємо індивідуальний розрахунок"
            description="Вартість визначається після консультації та уточнення матеріалів, термінів і деталей монтажу."
            className="text-white [&_h2]:text-white [&_p]:text-white/80"
          />
          <div className="rounded-3xl bg-white p-5 md:p-6">
            <InquiryForm compact />
          </div>
        </div>
      </Container>
    </section>
  );
}

