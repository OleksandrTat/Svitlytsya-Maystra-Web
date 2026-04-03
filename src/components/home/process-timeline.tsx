"use client";

import { Fragment } from "react";
import { MessageCircle, Ruler, PenTool, Hammer, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { craftFadeUp, craftStagger } from "@/lib/animation/variants";

const STEP_ICONS = [MessageCircle, Ruler, PenTool, Hammer, Wrench];
const STEP_NUMBERS = ["01", "02", "03", "04", "05"];
const STEP_KEYS = [
  { titleKey: "step1Title" as const, descKey: "step1Desc" as const },
  { titleKey: "step2Title" as const, descKey: "step2Desc" as const },
  { titleKey: "step3Title" as const, descKey: "step3Desc" as const },
  { titleKey: "step4Title" as const, descKey: "step4Desc" as const },
  { titleKey: "step5Title" as const, descKey: "step5Desc" as const },
];

export function ProcessTimeline() {
  const t = useTranslations("home.process");

  const steps = STEP_NUMBERS.map((number, i) => ({
    number,
    icon: STEP_ICONS[i]!,
    title: t(STEP_KEYS[i]!.titleKey),
    description: t(STEP_KEYS[i]!.descKey),
  }));

  return (
    <section className="section-padding bg-[var(--color-bg-warm)]">
      <Container>
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            {t("badge")}
          </p>
          <h2 className="heading-h1 text-[var(--color-text-primary)]">
            {t("title")}
          </h2>
        </div>

        {/* Desktop timeline */}
        <motion.div
          variants={craftStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-16 hidden items-start justify-between md:flex"
        >
          {steps.map((step, i) => (
            <Fragment key={step.number}>
              <motion.div
                variants={craftFadeUp}
                className="relative flex flex-1 flex-col items-center px-3 text-center"
              >
                <span className="absolute -top-4 font-display text-7xl font-bold text-[var(--color-accent)]/10">
                  {step.number}
                </span>
                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-100)]">
                  <step.icon className="h-6 w-6 text-[var(--color-accent)]" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-[var(--color-text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  {step.description}
                </p>
              </motion.div>
              {i < steps.length - 1 && (
                <div className="mt-7 w-12 flex-shrink-0 border-t-2 border-dashed border-[var(--color-accent)]/30 lg:w-16" />
              )}
            </Fragment>
          ))}
        </motion.div>

        {/* Mobile timeline */}
        <motion.div
          variants={craftStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-12 md:hidden"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              variants={craftFadeUp}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-100)]">
                  <step.icon className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                {i < steps.length - 1 && (
                  <div className="my-2 h-full w-px border-l-2 border-dashed border-[var(--color-accent)]/30" />
                )}
              </div>
              <div className="pb-8">
                <span className="text-xs font-medium text-[var(--color-accent)]">
                  {step.number}
                </span>
                <h3 className="font-display text-lg font-semibold text-[var(--color-text-primary)]">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
