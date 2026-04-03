import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/shared/newsletter-form";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export function SiteFooter() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");

  return (
    <footer className="bg-[var(--color-bg-dark)]">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-8">
        {/* Brand */}
        <div>
          <p className="font-display text-xl text-white">Svitlytsya Maystra</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/60">
            {t("tagline")}
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]"
              aria-label="Instagram"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
            </a>
            <a
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/60 transition hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]"
              aria-label="Facebook"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </a>
          </div>
        </div>

        {/* Catalog */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-light)]">
            {t("catalog")}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            <li>
              <Link href="/products?category=doors" className="transition hover:text-white">{t("doors")}</Link>
            </li>
            <li>
              <Link href="/products?category=furniture" className="transition hover:text-white">{t("furniture")}</Link>
            </li>
            <li>
              <Link href="/products?category=windows" className="transition hover:text-white">{t("windows")}</Link>
            </li>
            <li>
              <Link href="/products?category=restoration" className="transition hover:text-white">{t("restoration")}</Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-light)]">
            {t("company")}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            <li>
              <Link href="/services" className="transition hover:text-white">{tn("services")}</Link>
            </li>
            <li>
              <Link href="/products" className="transition hover:text-white">{tn("products")}</Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-white">{t("contacts")}</Link>
            </li>
            <li>
              <Link href="/blog" className="transition hover:text-white">{tn("blog")}</Link>
            </li>
            <li>
              <Link href="/faq" className="transition hover:text-white">FAQ</Link>
            </li>
          </ul>
          <div className="mt-4">
            <NewsletterForm variant="footer" />
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-light)]">
            {t("contactsTitle")}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            <li>
              <a href="tel:+380670000000" className="transition hover:text-white">
                +380 67 000-00-00
              </a>
            </li>
            <li>
              <a href="mailto:info@svitlytsya.ua" className="transition hover:text-white">
                info@svitlytsya.ua
              </a>
            </li>
            <li>{t("schedule")}</li>
            <li>{t("scheduleSat")}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/40 md:flex-row md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span>{t("copyright")}</span>
            <span className="hidden md:inline">·</span>
            <Link href="/privacy" className="transition hover:text-white/60">{t("privacy")}</Link>
            <span>·</span>
            <Link href="/terms" className="transition hover:text-white/60">{t("terms")}</Link>
            <span>·</span>
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
