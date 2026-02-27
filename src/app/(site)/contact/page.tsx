import type { Metadata } from "next";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { InquiryForm } from "@/components/shared/inquiry-form";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getContactSettings } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Зв'яжіться з майстернею Svitlytsya Maystra: консультація, прорахунок і старт проєкту.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const projectRef = typeof params.projectRef === "string" ? params.projectRef : undefined;
  const contacts = await getContactSettings();

  return (
    <>
      <section className="py-14 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <SectionHeading
                eyebrow="Контакти"
                title="Розкажіть про задачу і ми підготуємо рішення"
                description="Відповідаємо у робочий час. Якщо потрібно, погодимо виїзд на замір або консультацію на Об’єкті."
              />

              <dl className="grid gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-secondary)]">
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">Телефон</dt>
                  <dd>{contacts.phone}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">Email</dt>
                  <dd>{contacts.email}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">Адреса майстерні</dt>
                  <dd>{contacts.address}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">Графік</dt>
                  <dd>{contacts.hours}</dd>
                </div>
              </dl>

              <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">
                <iframe
                  title="Карта майстерні"
                  src="https://www.google.com/maps?q=Kyiv&output=embed"
                  width="100%"
                  height="280"
                  loading="lazy"
                  style={{ border: 0 }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6">
              <h2 className="font-display text-2xl text-[var(--color-text-primary)]">Форма заявки</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Заповніть коротку форму, і ми зв’яжемось найближчим часом.</p>
              <InquiryForm projectRefId={projectRef} className="mt-6" compact />
            </div>
          </div>
        </Container>
      </section>

      <FinalCtaSection projectRefId={projectRef} />
    </>
  );
}


