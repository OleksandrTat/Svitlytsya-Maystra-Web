"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export function SiteFooter() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const tc = useTranslations("common");

  const catalogLinks = [
    { href: "/products?category=doors", label: t("doors") },
    { href: "/products?category=furniture", label: t("furniture") },
    { href: "/products?category=windows", label: t("windows") },
    { href: "/products?category=restoration", label: t("restoration") },
  ];

  const companyLinks = [
    { href: "/services", label: tn("services") },
    { href: "/products", label: tn("products") },
    { href: "/contact", label: t("contacts") },
    { href: "/blog", label: tn("blog") },
    { href: "/faq", label: "FAQ" },
  ];

  const contactItems = [
    { icon: Phone, href: "tel:+380670000000", label: "+380 67 000-00-00" },
    { icon: Mail, href: "mailto:info@svitlytsya.ua", label: "info@svitlytsya.ua" },
    { icon: Clock, href: undefined, label: t("schedule") },
    { icon: Clock, href: undefined, label: t("scheduleSat") },
  ];

  return (
    <footer className="bg-[var(--color-primary-900)]">

      {/* ── Newsletter strip ── */}
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-7 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="shrink-0">
            <p className="text-sm font-semibold text-white">{tc("newsletter")}</p>
          </div>
          <div className="w-full max-w-xs">
            <NewsletterForm variant="footer" />
          </div>
        </div>
      </div>

      {/* ── Main columns ── */}
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 md:px-6 lg:grid-cols-[2fr_1fr_1fr_1.2fr] lg:gap-8">

        {/* Brand */}
        <div>
          <p className="font-display text-2xl font-semibold text-white">
            Svitlytsya Maystra
          </p>
          <p className="mt-3 max-w-[260px] text-sm leading-relaxed text-white/55">
            {t("tagline")}
          </p>
          <div className="mt-6 flex gap-2.5">
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/50 transition hover:border-[var(--color-accent-light)] hover:text-[var(--color-accent-light)]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/50 transition hover:border-[var(--color-accent-light)] hover:text-[var(--color-accent-light)]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Catalog */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-accent-light)]">
            {t("catalog")}
          </p>
          <ul className="mt-4 space-y-2.5">
            {catalogLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/55 transition hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-accent-light)]">
            {t("company")}
          </p>
          <ul className="mt-4 space-y-2.5">
            {companyLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-white/55 transition hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-accent-light)]">
            {t("contactsTitle")}
          </p>
          <ul className="mt-4 space-y-3">
            {contactItems.map((item, i) => {
              const Wrapper = item.href ? "a" : "span";
              const isSecondClock = item.icon === Clock && i === 3;
              return (
                <li key={i} className={isSecondClock ? "-mt-1" : ""}>
                  <Wrapper
                    {...(item.href ? { href: item.href } : {})}
                    className="flex items-center gap-2.5 text-sm text-white/55 transition hover:text-white"
                  >
                    {!isSecondClock && (
                      <item.icon size={13} className="shrink-0 text-[var(--color-accent-light)]/70" />
                    )}
                    {isSecondClock && <span className="w-[13px] shrink-0" />}
                    {item.label}
                  </Wrapper>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-white/30 md:flex-row md:px-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{t("copyright")}</span>
            <span className="hidden md:inline opacity-40">·</span>
            <Link href="/privacy" className="transition hover:text-white/60">{t("privacy")}</Link>
            <span className="opacity-40">·</span>
            <Link href="/terms" className="transition hover:text-white/60">{t("terms")}</Link>
            <span className="opacity-40">·</span>
            <Link href="/cookies" className="transition hover:text-white/60">{t("cookies")}</Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span>{t("madeWith")}</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
