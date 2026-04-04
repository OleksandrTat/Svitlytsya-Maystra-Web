import { Phone, Mail, Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { InquiryForm } from "@/components/shared/inquiry-form";
import type { getContactSettings } from "@/lib/data/queries";

type ContactSettings = Awaited<ReturnType<typeof getContactSettings>>;

type Props = {
  contacts: ContactSettings;
};

export async function ContactCtaSection({ contacts }: Props) {
  const [t, tFooter] = await Promise.all([
    getTranslations("contact"),
    getTranslations("footer"),
  ]);

  const contactRows = [
    { icon: Phone, label: t("phone"), value: contacts.phone },
    { icon: Mail, label: "Email", value: contacts.email },
    { icon: Clock, label: t("schedule"), value: tFooter("schedule") },
  ];

  return (
    <section className="grain section-padding relative overflow-hidden bg-[var(--color-primary)]">
      <Container className="relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-light)]">
              {t("badge")}
            </p>
            <h2 className="font-display text-4xl font-bold text-white md:text-5xl">
              {t("ctaTitle")}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/80">
              {t("ctaDesc")}
            </p>

            <div className="mt-8 space-y-4">
              {contactRows.map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <row.icon className="h-5 w-5 shrink-0 text-[var(--color-accent-light)]" />
                  <span className="mt-0.5 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-light)]">
                    {row.label}
                  </span>
                  <span className="text-sm text-white/90">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-primary-500)] bg-[var(--color-bg)] p-8">
            <h3 className="font-display text-2xl text-[var(--color-text-primary)]">
              {t("formTitle")}
            </h3>
            <InquiryForm compact className="mt-6" />
          </div>
        </div>
      </Container>
    </section>
  );
}
