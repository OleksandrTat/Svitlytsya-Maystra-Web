"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { craftFadeUp, craftFadeLeft, craftStagger } from "@/lib/animation/variants";

const advantages = [
  {
    number: "01",
    title: "Власне виробництво",
    description: "Контролюємо кожен етап без посередників",
  },
  {
    number: "02",
    title: "Натуральні матеріали",
    description: "Тільки перевірена деревина та фурнітура",
  },
  {
    number: "03",
    title: "Гарантія 3 роки",
    description: "Офіційна гарантія на всі роботи",
  },
  {
    number: "04",
    title: "Безкоштовна консультація",
    description: "Допоможемо обрати рішення під ваш простір",
  },
];

export function WhyUsSection() {
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
              Чому ми
            </p>
            <h2 className="font-display text-4xl font-bold leading-tight text-white md:text-5xl">
              Якість, яку видно
              <br />і відчуваєш
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-[var(--color-on-primary-muted)]">
              Ми не продаємо шаблонні рішення. Кожен виріб проєктується під
              конкретний простір, а матеріали підбираються індивідуально.
            </p>
          </motion.div>

          <motion.div
            variants={craftStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {advantages.map((item, i) => (
              <motion.div
                key={item.number}
                variants={craftFadeLeft}
                className={
                  i < advantages.length - 1
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
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-white/60">
                      {item.description}
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
