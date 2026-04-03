"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { craftFadeUp, craftStagger, scaleOnHover } from "@/lib/animation/variants";

const SERVICE_KEYS = [
  {
    number: "01",
    titleKey: "doorsTitle" as const,
    descKey: "doorsDesc" as const,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  },
  {
    number: "02",
    titleKey: "furnitureTitle" as const,
    descKey: "furnitureDesc" as const,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
  },
  {
    number: "03",
    titleKey: "windowsTitle" as const,
    descKey: "windowsDesc" as const,
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    number: "04",
    titleKey: "restorationTitle" as const,
    descKey: "restorationDesc" as const,
    image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
  },
];

export function ServicesGrid() {
  const t = useTranslations("home.services");

  return (
    <section className="section-padding bg-[var(--color-bg-warm)]">
      <Container>
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            {t("badge")}
          </p>
          <h2 className="heading-h1 text-[var(--color-text-primary)]">{t("title")}</h2>
          <p className="body-base mt-4 text-[var(--color-text-secondary)]">
            {t("subtitle")}
          </p>
        </div>

        <motion.div
          variants={craftStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-12 grid gap-6 md:grid-cols-2"
        >
          {SERVICE_KEYS.map((service) => (
            <motion.div key={service.number} variants={craftFadeUp}>
              <motion.div
                initial="rest"
                whileHover="hover"
                variants={scaleOnHover}
              >
                <Link
                  href="/services"
                  className="group relative block h-[380px] overflow-hidden rounded-2xl"
                >
                  <Image
                    src={service.image}
                    alt={t(service.titleKey)}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 transition duration-300 group-hover:bg-black/10"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(26,10,10,0.85) 0%, rgba(26,10,10,0.3) 50%, transparent 100%)",
                    }}
                  />

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="font-display text-5xl font-bold text-[var(--color-accent-light)]/20">
                      {service.number}
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-white">
                      {t(service.titleKey)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      {t(service.descKey)}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent-light)] transition group-hover:gap-2">
                      {t("learnMore")}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
