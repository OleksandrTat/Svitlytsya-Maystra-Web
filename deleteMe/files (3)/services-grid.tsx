"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Feature = { title: string; description: string };

type Service = {
  id: string;
  title: string;
  slug: string;
  tagline?: string | null;
  short_description?: string | null;
  icon?: string | null;
  cover_image?: string | null;
  category: string;
  features: Feature[];
  price_from?: number | null;
  price_unit?: string | null;
  duration_days_from?: number | null;
  duration_days_to?: number | null;
  is_featured: boolean;
};

type Props = { services: Service[]; className?: string };

const CAT_GRADIENT: Record<string, string> = {
  production:   "from-amber-600 to-amber-800",
  consultation: "from-sky-600 to-sky-800",
  installation: "from-violet-600 to-violet-800",
  restoration:  "from-emerald-600 to-emerald-800",
};

const CAT_ACCENT: Record<string, string> = {
  production:   "border-amber-200 bg-amber-50",
  consultation: "border-sky-200 bg-sky-50",
  installation: "border-violet-200 bg-violet-50",
  restoration:  "border-emerald-200 bg-emerald-50",
};

const CAT_TEXT: Record<string, string> = {
  production:   "text-amber-700",
  consultation: "text-sky-700",
  installation: "text-violet-700",
  restoration:  "text-emerald-700",
};

function ServiceCard({ service, index }: { service: Service; index: number }) {
  const gradient = CAT_GRADIENT[service.category] ?? "from-zinc-600 to-zinc-800";
  const accent = CAT_ACCENT[service.category] ?? "";
  const text = CAT_TEXT[service.category] ?? "";
  const topFeatures = service.features.slice(0, 3);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-sm transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1",
        service.is_featured && "ring-2 ring-[var(--color-primary)] ring-offset-2",
      )}
    >
      {/* Featured badge */}
      {service.is_featured && (
        <div className="absolute right-4 top-4 z-10 rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
          ⭐ Популярне
        </div>
      )}

      {/* Hero area */}
      <div className={cn("relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br", gradient)}>
        {service.cover_image ? (
          <>
            <Image src={service.cover_image} alt={service.title} fill className="object-cover opacity-30 transition group-hover:scale-105 group-hover:opacity-40" sizes="400px" />
          </>
        ) : null}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <span className="text-5xl drop-shadow-lg">{service.icon ?? "🪵"}</span>
        </div>

        {/* Price badge */}
        {service.price_from && (
          <div className="absolute bottom-3 left-4 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">
            <span className="text-xs font-semibold text-white">
              від {Number(service.price_from).toLocaleString("uk-UA")} {service.price_unit ?? "грн"}
            </span>
          </div>
        )}

        {/* Duration badge */}
        {service.duration_days_from && (
          <div className="absolute bottom-3 right-4 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">
            <Clock size={10} className="text-white/80" />
            <span className="text-xs font-semibold text-white">
              {service.duration_days_from}–{service.duration_days_to ?? service.duration_days_from} дн.
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3">
          <h3 className="font-display text-xl font-semibold leading-tight text-[var(--color-text-primary)]">
            {service.title}
          </h3>
          {service.tagline && (
            <p className={cn("mt-1 text-sm font-medium italic", text)}>{service.tagline}</p>
          )}
          {service.short_description && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-3">
              {service.short_description}
            </p>
          )}
        </div>

        {/* Features */}
        {topFeatures.length > 0 && (
          <ul className="mb-4 space-y-1.5">
            {topFeatures.map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 size={14} className={cn("mt-0.5 shrink-0", text)} />
                <span className="text-[var(--color-text-secondary)]">{feat.title}</span>
              </li>
            ))}
            {service.features.length > 3 && (
              <li className="pl-5 text-xs text-[var(--color-text-secondary)]">
                +{service.features.length - 3} більше
              </li>
            )}
          </ul>
        )}

        {/* CTA */}
        <div className="mt-auto flex gap-2">
          <Link href={`/services/${service.slug}`}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
              service.is_featured
                ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-700)]"
                : cn(accent, text, "border hover:shadow-sm"),
            )}>
            Детальніше <ArrowRight size={14} />
          </Link>
          <Link href="/contact"
            className="flex items-center justify-center rounded-2xl border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface)]">
            Зв'язатись
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export function ServicesGrid({ services, className }: Props) {
  if (services.length === 0) return null;

  const featured = services.filter((s) => s.is_featured);
  const regular  = services.filter((s) => !s.is_featured);

  return (
    <section className={cn("space-y-8", className)}>
      {/* Section header */}
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Що ми робимо</p>
        <h2 className="font-display text-3xl text-[var(--color-text-primary)] md:text-4xl">Наші послуги</h2>
        <p className="mx-auto max-w-xl text-[var(--color-text-secondary)]">
          Від ідеї до готового виробу — повний цикл роботи з деревом під ваші потреби
        </p>
      </div>

      {/* Featured services — larger */}
      {featured.length > 0 && (
        <div className={cn(
          "grid gap-5",
          featured.length === 1 ? "grid-cols-1 max-w-lg mx-auto" :
          featured.length === 2 ? "grid-cols-1 md:grid-cols-2" :
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        )}>
          {featured.map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i} />
          ))}
        </div>
      )}

      {/* Regular services — smaller grid */}
      {regular.length > 0 && (
        <div className={cn(
          "grid gap-4",
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        )}>
          {regular.map((s, i) => (
            <ServiceCard key={s.id} service={s} index={featured.length + i} />
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="text-center">
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Не знайшли потрібне? Ми можемо зробити індивідуальний проєкт
        </p>
        <Link href="/contact"
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-700)] transition">
          Обговорити проєкт <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
