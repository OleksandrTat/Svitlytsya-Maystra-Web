import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function HomeQualitySection() {
  return (
    <section className="bg-[var(--color-surface)] py-14 md:py-20">
      <Container>
        <div className="grid gap-10 md:grid-cols-2">
          <SectionHeading
            eyebrow="Гарантія та якість"
            title="Матеріали та контроль, за які не соромно"
            description="Працюємо з перевіреними матеріалами, тестуємо вузли відкривання й фурнітуру, надаємо гарантію на виконані роботи."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="relative h-44 overflow-hidden rounded-2xl">
              <Image
                src="https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&w=900&q=80"
                alt="Фактура деревини"
                fill
                className="object-cover"
              />
            </div>
            <div className="relative h-44 overflow-hidden rounded-2xl">
              <Image
                src="https://images.unsplash.com/photo-1600566753058-f0b7e7f2f0f5?auto=format&fit=crop&w=900&q=80"
                alt="Деталі фурнітури"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

