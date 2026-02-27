import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stars } from "@/components/ui/stars";
import type { Testimonial } from "@/lib/types";

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  return (
    <section className="py-14 md:py-20">
      <Container>
        <SectionHeading
          eyebrow="Відгуки"
          title="Що кажуть клієнти після завершення проєкту"
          description="Публікуємо лише реальні відгуки від клієнтів, які пройшли повний цикл робіт."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.id} className="flex h-full flex-col justify-between bg-white">
              <div>
                <Stars rating={item.rating} />
                <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">{item.content}</p>
              </div>
              <div className="mt-6 border-t border-[var(--color-border)] pt-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.author_name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{item.author_location ?? "Україна"}</p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

