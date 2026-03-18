import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <p className="font-display text-xl text-[var(--color-primary)]">Svitlytsya Maystra</p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
            Сімейна майстерня дверей, меблів і вікон. 26+ років досвіду та
            індивідуальні рішення під ваш простір.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Навігація</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li>
              <Link href="/catalog">Каталог робіт</Link>
            </li>
            <li>
              <Link href="/products">Продукти</Link>
            </li>
            <li>
              <Link href="/services">Послуги</Link>
            </li>
            <li>
              <Link href="/contact">Контакти</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Контент</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li>
              <Link href="/blog">Блог компанії</Link>
            </li>
            <li>
              <Link href="/cultural">Культурний блог</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Юридична інформація</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms">Terms of Use</Link>
            </li>
            <li>
              <Link href="/cookies">Cookie Policy</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] px-4 py-4 text-center text-xs text-[var(--color-text-secondary)]">
        Svitlytsya Maystra · Etap 1 MVP · 2025
      </div>
    </footer>
  );
}
