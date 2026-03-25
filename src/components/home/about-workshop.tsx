"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Container } from "@/components/ui/container";
import { craftFadeUp } from "@/lib/animation/variants";

const stats = [
  { value: "26", label: "років" },
  { value: "20 000+", label: "проєктів" },
  { value: "100%", label: "індивідуально" },
];

export function AboutWorkshop() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section className="section-padding" ref={ref}>
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[55%_45%]">
          <div className="relative overflow-hidden rounded-3xl">
            <motion.div className="relative h-[450px] lg:h-[580px]" style={{ y }}>
              <Image
                src="https://images.unsplash.com/photo-1588854337115-1c67d9247e4d?auto=format&fit=crop&w=1200&q=80"
                alt="Майстер за роботою"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </motion.div>
            <div className="absolute bottom-6 left-6 rounded-xl bg-[var(--color-primary)]/90 px-5 py-3 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="h-px w-6 bg-[var(--color-accent-light)]" />
                <span className="text-sm font-medium text-white">
                  1998 — рік заснування
                </span>
              </div>
            </div>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={craftFadeUp}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Наша історія
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-[var(--color-text-primary)] md:text-4xl">
              Сімейна майстерня
              <br />з 26-річною традицією
            </h2>
            <p className="mt-5 text-base leading-7 text-[var(--color-text-secondary)]">
              Svitlytsya Maystra — це сімейна справа, засновна у 1998 році. Ми
              спеціалізуємось на виробництві дверей, меблів та вікон з натурального
              дерева. Кожен виріб — це індивідуальний проєкт з увагою до кожної
              деталі.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl font-bold text-[var(--color-accent)] md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] transition hover:gap-3"
            >
              Дізнатися більше про нас
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
