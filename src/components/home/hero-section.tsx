"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { CountUp } from "@/components/ui/count-up";
import { craftFadeUp, craftStagger } from "@/lib/animation/variants";

const counters = [
  { value: 26, suffix: "+", labelKey: "yearsLabel" as const },
  { value: 20000, suffix: "+", labelKey: "projectsLabel" as const },
  { value: 3, suffix: "", labelKey: "warrantyLabel" as const },
];

export function HeroSection() {
  const t = useTranslations("home.hero");

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

      {/* Overlay: solid left → transparent right */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(20,6,6,0.92) 0%, rgba(20,6,6,0.82) 35%, rgba(20,6,6,0.45) 58%, transparent 75%)",
        }}
      />

      <div className="relative z-10 flex flex-1 items-center">
        <Container className="pb-8 pt-32">
          <div className="max-w-xl">
            {/* Eyebrow */}
            <motion.p
              className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--color-accent-light)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {t("eyebrow")}
            </motion.p>

            <motion.div
              variants={craftStagger}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={craftFadeUp}>
                <span className="block font-display text-5xl font-bold leading-[1.08] text-white md:text-6xl lg:text-7xl">
                  {t("title")}
                </span>
              </motion.div>
            </motion.div>

            {/* Accent bar */}
            <motion.div
              className="mt-6 h-px w-16 bg-[var(--color-accent-light)]"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              style={{ originX: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            />

            <motion.p
              className="mt-5 max-w-sm text-base leading-relaxed text-white/70"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              {t("subtitle")}
            </motion.p>

            <motion.div
              className="mt-9 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-7 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]"
              >
                {t("cta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/40 px-7 text-sm font-semibold text-white transition hover:border-white/70 hover:bg-white/10"
              >
                {t("secondary")}
              </Link>
            </motion.div>
          </div>
        </Container>
      </div>

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
                key={counter.labelKey}
                variants={craftFadeUp}
                className="text-center"
              >
                <p className="font-display text-3xl font-bold text-[var(--color-accent-light)] md:text-4xl">
                  <CountUp end={counter.value} suffix={counter.suffix} />
                </p>
                <p className="mt-1 text-xs text-[var(--color-on-primary-faint)] md:text-sm">
                  {t(counter.labelKey)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </div>
    </section>
  );
}
