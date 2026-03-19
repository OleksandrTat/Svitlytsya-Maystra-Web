"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  services: Service[];
  className?: string;
};

const CATEGORY_META: Record<string, { accent: string; badge: string }> = {
  production: {
    accent: "from-amber-600 to-orange-700",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
  consultation: {
    accent: "from-sky-600 to-blue-700",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
  },
  installation: {
    accent: "from-violet-600 to-fuchsia-700",
    badge: "border-violet-200 bg-violet-50 text-violet-700",
  },
  restoration: {
    accent: "from-emerald-600 to-teal-700",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

export function ServicesGrid({ services, className }: Props) {
  if (services.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-8", className)}>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
          Що ми робимо
        </p>
        <h2 className="mt-3 font-display text-3xl text-[var(--color-text-primary)] md:text-4xl">
          Послуги майстерні
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--color-text-secondary)]">
          Від консультації та проєктування до виробництва, монтажу і відновлення дерев&rsquo;яних виробів.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service, index) => {
          const meta = CATEGORY_META[service.category] ?? CATEGORY_META.production;

          return (
            <motion.article
              key={service.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              className={cn(
                "overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-white shadow-sm",
                service.is_featured && "ring-2 ring-[var(--color-primary)] ring-offset-2",
              )}
            >
              <div className={cn("relative h-52 bg-gradient-to-br", meta.accent)}>
                {service.cover_image ? (
                  <Image
                    src={service.cover_image}
                    alt={service.title}
                    fill
                    className="object-cover opacity-35"
                    sizes="(max-width: 1280px) 50vw, 33vw"
                  />
                ) : null}
                <div className="relative z-10 flex h-full flex-col justify-between p-5 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-4xl">{service.icon ?? "🚪"}</span>
                    <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-medium backdrop-blur">
                      {service.category}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">{service.title}</h3>
                    {service.tagline ? <p className="mt-1 text-sm text-white/85">{service.tagline}</p> : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex flex-wrap gap-2">
                  <span className={cn("rounded-full border px-2 py-1 text-[11px] font-medium", meta.badge)}>
                    {service.category}
                  </span>
                  {service.price_from ? (
                    <span className="rounded-full border border-[var(--color-border)] px-2 py-1 text-[11px] text-[var(--color-text-secondary)]">
                      від {service.price_from.toLocaleString("uk-UA")} {service.price_unit ?? "грн"}
                    </span>
                  ) : null}
                  {service.duration_days_from ? (
                    <span className="rounded-full border border-[var(--color-border)] px-2 py-1 text-[11px] text-[var(--color-text-secondary)]">
                      {service.duration_days_from}-{service.duration_days_to ?? service.duration_days_from} днів
                    </span>
                  ) : null}
                </div>

                <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
                  {service.short_description}
                </p>

                {service.features.length > 0 ? (
                  <ul className="space-y-2">
                    {service.features.slice(0, 3).map((feature) => (
                      <li key={feature.title} className="text-sm text-[var(--color-text-secondary)]">
                        • {feature.title}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="flex gap-3">
                  <Link
                    href={`/services/${service.slug}`}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white"
                  >
                    Детальніше
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-secondary)]"
                  >
                    Зв&rsquo;язатися
                  </Link>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
