"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import type { Certificate } from "@/lib/types";

export function CertificatesSection({
  certificates,
}: {
  certificates: Certificate[];
}) {
  const t = useTranslations("common");

  if (certificates.length === 0) return null;

  return (
    <section className="bg-[var(--color-bg-dark)] py-16 md:py-24">
      <Container>
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-light)]">
            {t("certificates")}
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white md:text-4xl">
            {t("certificatesSubtitle")}
          </h2>
        </div>

        {/* Scrollable on mobile, grid on desktop */}
        <div className="flex gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4">
          {certificates.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group flex min-w-[260px] flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition-all duration-300 hover:scale-[1.02] hover:border-[var(--color-accent-light)]/40 md:min-w-0"
            >
              {cert.image_url ? (
                <div className="relative mb-4 h-28 w-full">
                  <Image
                    src={cert.image_url}
                    alt={cert.title}
                    fill
                    className="object-contain"
                    sizes="260px"
                  />
                </div>
              ) : (
                <div className="mb-4 flex h-28 w-full items-center justify-center">
                  <Award
                    size={48}
                    className="text-[var(--color-accent-light)]"
                  />
                </div>
              )}

              <h3 className="font-display text-lg font-semibold text-white">
                {cert.title}
              </h3>
              <p className="mt-1 text-sm text-white/60">{cert.issuer}</p>

              {cert.issued_year && (
                <span className="mt-3 inline-block rounded-full bg-white/10 px-3 py-0.5 text-xs text-white/70">
                  {cert.issued_year}
                </span>
              )}

              {cert.description && (
                <p className="mt-3 text-xs leading-relaxed text-white/40">
                  {cert.description}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm italic text-white/40">
          {t("certificatesNote")}
        </p>
      </Container>
    </section>
  );
}
