"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { CountUp } from "@/components/ui/count-up";
import { craftFadeUp, craftStagger } from "@/lib/animation/variants";

const counters = [
  { value: 26, suffix: "+", label: "років досвіду" },
  { value: 20000, suffix: "+", label: "реалізованих робіт" },
  { value: 3, suffix: "", label: "роки гарантії" },
];

const headingLines = ["Ручна робота,", "якій довіряють", "роками"];

export function HeroSection() {
  return (
    <section className="relative isolate -mt-[72px] flex min-h-screen flex-col overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1920&q=80"
        alt="Деревообробка в майстерні"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(26,10,10,0.88) 0%, rgba(92,26,26,0.65) 50%, rgba(139,69,19,0.40) 100%)",
        }}
      />

      <Container className="relative z-10 mt-auto pb-0 pt-32">
        <div className="max-w-3xl">
          <motion.div
            variants={craftStagger}
            initial="hidden"
            animate="visible"
          >
            {headingLines.map((line, i) => (
              <motion.div key={i} variants={craftFadeUp} custom={i}>
                <span className="block font-display text-5xl font-bold leading-[1.08] text-[var(--color-on-primary)] md:text-7xl lg:text-8xl">
                  {line}
                </span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-4 flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <span className="h-px flex-1 max-w-16 bg-[var(--color-accent-light)]" />
            <span className="text-[var(--color-accent-light)]">✦</span>
            <span className="h-px flex-1 max-w-16 bg-[var(--color-accent-light)]" />
          </motion.div>

          <motion.p
            className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-on-primary-muted)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            Авторські двері, меблі та вікна з натуральних матеріалів. Майстерня
            Svitlytsya — 26 років традицій і точності.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-7 text-sm font-semibold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-700)]"
            >
              Переглянути продукти
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-white/60 px-7 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Отримати розрахунок
            </Link>
          </motion.div>
        </div>
      </Container>

      <div className="relative z-10 mt-12 border-t border-white/10 bg-[var(--color-primary-900)]/80 backdrop-blur">
        <Container>
          <motion.div
            variants={craftStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-3 divide-x divide-white/10 py-6"
          >
            {counters.map((counter) => (
              <motion.div
                key={counter.label}
                variants={craftFadeUp}
                className="text-center"
              >
                <p className="font-display text-3xl font-bold text-[var(--color-accent-light)] md:text-4xl">
                  <CountUp end={counter.value} suffix={counter.suffix} />
                </p>
                <p className="mt-1 text-xs text-[var(--color-on-primary-faint)] md:text-sm">
                  {counter.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </div>
    </section>
  );
}
