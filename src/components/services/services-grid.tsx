"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  services: Service[];
  className?: string;
};

const FALLBACK_IMAGES: Record<string, string> = {
  doors:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  furniture:
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
  windows:
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  restoration:
    "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80",
};

const SERVICE_ICONS: Record<string, string> = {
  doors: "🚪",
  furniture: "🪑",
  windows: "🪟",
  restoration: "🔧",
};

export function ServicesAccordion({ services, className }: Props) {
  const locale = useLocale();
  const t = useTranslations("servicesPage");
  const [openId, setOpenId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const numberLocale = locale === "uk" ? "uk-UA" : "en-US";

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (openId) {
      const el = itemRefs.current.get(openId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [openId]);

  if (services.length === 0) return null;

  return (
    <div className={cn("divide-y divide-[var(--color-border)]", className)}>
      {services.map((service, index) => {
        const isOpen = openId === service.id;
        const num = String(index + 1).padStart(2, "0");
        const icon = service.icon ?? SERVICE_ICONS[service.category] ?? "🔨";
        const image =
          service.cover_image ?? FALLBACK_IMAGES[service.category] ?? FALLBACK_IMAGES.doors;
        const priceUnit =
          locale === "en" && (service.price_unit ?? "грн") === "грн"
            ? "UAH"
            : (service.price_unit ?? (locale === "en" ? "UAH" : "грн"));

        return (
          <div
            key={service.id}
            ref={(el) => {
              if (el) itemRefs.current.set(service.id, el);
            }}
            className="scroll-mt-24"
          >
            {/* Header row */}
            <button
              type="button"
              onClick={() => toggle(service.id)}
              className={cn(
                "flex w-full items-center gap-4 px-2 py-5 text-left transition-colors md:gap-6 md:px-4",
                isOpen
                  ? "bg-[var(--color-bg-warm)]"
                  : "hover:bg-[var(--color-bg-warm)]",
              )}
            >
              <span className="hidden font-display text-4xl text-[var(--color-primary)] opacity-30 md:block">
                {num}
              </span>
              <span className="text-2xl">{icon}</span>
              <span className="flex-1 font-display text-xl font-semibold text-[var(--color-text-primary)] md:text-2xl">
                {service.title}
              </span>
              {service.price_from && (
                <span className="hidden text-sm text-[var(--color-text-muted)] md:block">
                  {t("accordionPriceFrom", {
                    amount: service.price_from.toLocaleString(numberLocale),
                    unit: priceUnit,
                  })}
                </span>
              )}
              <ChevronDown
                size={20}
                className={cn(
                  "shrink-0 text-[var(--color-text-muted)] transition-transform duration-300",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {/* Content */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="grid gap-6 px-2 pb-8 pt-2 md:grid-cols-[40%_1fr] md:px-4">
                    {/* Photo */}
                    <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                      <Image
                        src={image}
                        alt={service.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 40vw"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex flex-col gap-5">
                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                        {service.description || service.short_description}
                      </p>

                      {/* Features */}
                      {service.features.length > 0 && (
                        <div className="space-y-3">
                          {service.features.map((feature) => (
                            <div key={feature.title} className="flex gap-3">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
                                <Check size={12} />
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                                  {feature.title}
                                </p>
                                {feature.description && (
                                  <p className="text-sm text-[var(--color-text-muted)]">
                                    {feature.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Process steps */}
                      {service.process_steps.length > 0 && (
                        <>
                          <div className="border-t border-[var(--color-border)]" />
                          <div>
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                              {t("accordionProcessTitle")}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {service.process_steps.map((step, i) => (
                                <div key={step.step} className="flex items-center gap-2">
                                  {i > 0 && (
                                    <span className="text-[var(--color-border)]">→</span>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-primary)] text-xs font-semibold text-[var(--color-primary)]">
                                      {step.step}
                                    </span>
                                    <span className="text-sm text-[var(--color-text-primary)]">
                                      {step.title}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* CTA */}
                      <div className="border-t border-[var(--color-border)]" />
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href="/contact"
                          className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)]"
                        >
                          {t("accordionConsultationCta")}
                        </Link>
                        <Link
                          href={`/services/${service.slug}` as "/services/[slug]"}
                          className="rounded-full border border-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                        >
                          {t("accordionServiceDetailsCta")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// Keep backward-compatible export
export { ServicesAccordion as ServicesGrid };
