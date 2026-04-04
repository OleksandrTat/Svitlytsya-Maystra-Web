import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { InquiryForm } from "@/components/shared/inquiry-form";

export async function FinalCtaSection() {
  const t = await getTranslations("finalCta");

  return (
    <section className="grain relative overflow-hidden bg-[var(--color-bg-section)] py-16 md:py-24">
      {/* Decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[var(--color-primary)]/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[var(--color-accent)]/10 blur-3xl"
      />

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

          {/* Left — text */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              {t("eyebrow")}
            </p>
            <h2 className="font-display text-4xl font-bold leading-tight text-[var(--color-primary)] md:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--color-text-secondary)]">
              {t("description")}
            </p>

            {/* Trust line */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
              {[t("trust1"), t("trust2"), t("trust3")].map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right — form card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-white px-6 py-8 shadow-lg md:px-8">
            <h3 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
              {t("formTitle")}
            </h3>
            <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
              {t("formSubtitle")}
            </p>
            <InquiryForm compact className="mt-6" />
          </div>

        </div>
      </Container>
    </section>
  );
}

