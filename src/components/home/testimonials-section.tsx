"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Stars } from "@/components/ui/stars";
import { craftFadeUp, craftStagger } from "@/lib/animation/variants";
import type { Testimonial } from "@/lib/types";

type Props = {
  testimonials: Testimonial[];
};

export function TestimonialsSection({ testimonials }: Props) {
  const t = useTranslations("home.testimonials");

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="section-padding bg-[var(--color-bg)]">
      <Container>
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            {t("eyebrow")}
          </p>
          <h2 className="heading-h1 text-[var(--color-text-primary)]">
            {t("title")}
          </h2>
        </div>

        <motion.div
          variants={craftStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {testimonials.map((item) => (
            <motion.article
              key={item.id}
              variants={craftFadeUp}
              className="relative rounded-2xl border-l-4 border-[var(--color-primary)] bg-[var(--color-surface)] p-7"
            >
              <span className="absolute right-6 top-4 font-display text-6xl leading-none text-[var(--color-accent)]/20">
                &ldquo;
              </span>

              <blockquote className="relative z-10 mt-4 font-display text-lg italic leading-8 text-[var(--color-text-primary)]">
                {item.content}
              </blockquote>

              <div className="mt-4">
                <Stars rating={item.rating} />
              </div>

              <footer className="mt-4 border-t border-[var(--color-border)] pt-4">
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {item.author_name}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {item.author_location ?? t("defaultLocation")}
                </p>
              </footer>
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
