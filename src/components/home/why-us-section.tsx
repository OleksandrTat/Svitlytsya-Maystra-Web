"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { craftFadeUp, craftFadeLeft, craftStagger } from "@/lib/animation/variants";

const ADVANTAGE_KEYS = [
  { number: "01", titleKey: "ownProdTitle" as const, descKey: "ownProdDesc" as const },
  { number: "02", titleKey: "naturalTitle" as const, descKey: "naturalDesc" as const },
  { number: "03", titleKey: "warrantyTitle" as const, descKey: "warrantyDesc" as const },
  { number: "04", titleKey: "consultTitle" as const, descKey: "consultDesc" as const },
];

export function WhyUsSection() {
  const t = useTranslations("home.whyUs");

  return (
    <section className="section-padding bg-[var(--color-bg-dark)]">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={craftFadeUp}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-light)]">
              {t("badge")}
            </p>
            <h2 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[var(--color-on-primary-muted)]">
              {t("subtitle")}
            </p>
          </motion.div>

          <motion.div
            variants={craftStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {ADVANTAGE_KEYS.map((item, i) => (
              <motion.div
                key={item.number}
                variants={craftFadeLeft}
                className={
                  i < ADVANTAGE_KEYS.length - 1
                    ? "border-b border-white/10 py-6"
                    : "py-6"
                }
              >
                <div className="flex items-start gap-5">
                  <span className="font-display text-2xl font-light text-[var(--color-accent-light)]">
                    {item.number}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white">
                      {t(item.titleKey)}
                    </h3>
                    <p className="mt-1 text-sm text-white/60">
                      {t(item.descKey)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
