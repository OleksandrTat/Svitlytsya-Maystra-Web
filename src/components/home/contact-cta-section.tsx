import { Phone, Mail, Clock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { InquiryForm } from "@/components/shared/inquiry-form";
import type { getContactSettings } from "@/lib/data/queries";

type ContactSettings = Awaited<ReturnType<typeof getContactSettings>>;

type Props = {
  contacts: ContactSettings;
};

const contactRows = [
  { icon: Phone, label: "Телефон", key: "phone" as const },
  { icon: Mail, label: "Email", key: "email" as const },
  { icon: Clock, label: "Графік", key: "hours" as const },
];

export function ContactCtaSection({ contacts }: Props) {
  return (
    <section className="grain section-padding relative overflow-hidden bg-[var(--color-primary)]">
      <Container className="relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-light)]">
              Консультація
            </p>
            <h2 className="font-display text-4xl font-bold text-[var(--color-on-primary)] md:text-5xl">
              Розкажіть про
              <br />
              вашу задачу
            </h2>
            <p className="body-base mt-5 max-w-md text-[var(--color-on-primary-muted)]">
              Вартість визначається після консультації та уточнення матеріалів,
              термінів і деталей монтажу. Відповідаємо у робочий час.
            </p>

            <div className="mt-8 space-y-4">
              {contactRows.map((row) => (
                <div key={row.key} className="flex items-center gap-3">
                  <row.icon className="h-5 w-5 shrink-0 text-[var(--color-accent-light)]" />
                  <span className="mt-0.5 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-light)]">
                    {row.label}
                  </span>
                  <span className="text-sm text-[var(--color-on-primary-muted)]">
                    {contacts[row.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-primary-500)] bg-[var(--color-bg)] p-8">
            <h3 className="font-display text-2xl text-[var(--color-text-primary)]">
              Форма заявки
            </h3>
            <InquiryForm compact className="mt-6" />
          </div>
        </div>
      </Container>
    </section>
  );
}
