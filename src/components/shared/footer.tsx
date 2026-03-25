import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--color-bg-dark)]">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <p className="font-display text-xl text-white">Svitlytsya Maystra</p>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Сімейна майстерня дверей, меблів і вікон. 26+ років досвіду та
            індивідуальні рішення під ваш простір.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-light)]">
            Навігація
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            <li>
              <Link href="/products" className="transition hover:text-white">Продукти</Link>
            </li>
            <li>
              <Link href="/services" className="transition hover:text-white">Послуги</Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-white">Контакти</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-light)]">
            Юридична інформація
          </p>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            <li>
              <Link href="/privacy" className="transition hover:text-white">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms" className="transition hover:text-white">Terms of Use</Link>
            </li>
            <li>
              <Link href="/cookies" className="transition hover:text-white">Cookie Policy</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/40">
        Svitlytsya Maystra · 2026
      </div>
    </footer>
  );
}
