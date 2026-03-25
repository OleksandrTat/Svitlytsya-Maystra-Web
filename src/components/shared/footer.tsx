import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--color-bg-dark)]">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 md:grid-cols-2 md:px-6 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-8">
        {/* Brand */}
        <div>
          <p className="font-display text-xl text-white">Svitlytsya Maystra</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/60">
            Сімейна майстерня дерев&rsquo;яних виробів. 26+ років традицій та
            індивідуальних рішень під ваш простір.
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

        {/* Каталог */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-light)]">
            Каталог
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            <li>
              <Link href="/products?category=doors" className="transition hover:text-white">Двері</Link>
            </li>
            <li>
              <Link href="/products?category=furniture" className="transition hover:text-white">Меблі</Link>
            </li>
            <li>
              <Link href="/products?category=windows" className="transition hover:text-white">Вікна</Link>
            </li>
            <li>
              <Link href="/products?category=restoration" className="transition hover:text-white">Реставрація</Link>
            </li>
          </ul>
        </div>

        {/* Компанія */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-light)]">
            Компанія
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            <li>
              <Link href="/services" className="transition hover:text-white">Послуги</Link>
            </li>
            <li>
              <Link href="/products" className="transition hover:text-white">Продукти</Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-white">Контакти</Link>
            </li>
          </ul>
        </div>

        {/* Контакти */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent-light)]">
            Контакти
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
            <li>Пн–Пт: 09:00–18:00</li>
            <li>Сб: 10:00–15:00</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/40 md:flex-row md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span>&copy; 2026 Svitlytsya Maystra</span>
            <span className="hidden md:inline">·</span>
            <Link href="/privacy" className="transition hover:text-white/60">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="transition hover:text-white/60">Terms of Use</Link>
            <span>·</span>
            <Link href="/cookies" className="transition hover:text-white/60">Cookies</Link>
          </div>
          <span>Зроблено з ♥ в Україні</span>
        </div>
      </div>
    </footer>
  );
}
