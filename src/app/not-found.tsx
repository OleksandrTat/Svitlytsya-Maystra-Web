import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Сторінку не знайдено | Svitlytsya Maystra",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-16">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
        <p className="font-display text-[120px] font-bold leading-none text-[var(--color-primary)] opacity-20 select-none md:text-[160px]">
          404
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[var(--color-text-primary)] md:text-4xl">
          Сторінку не знайдено
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          Схоже, ця сторінка була переміщена або її більше не існує. Перейдіть на
          головну або перегляньте наші продукти.
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="flex h-12 items-center justify-center rounded-full bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-700)]"
          >
            На головну
          </Link>
          <Link
            href="/products"
            className="flex h-12 items-center justify-center rounded-full border border-[var(--color-primary)] px-6 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
          >
            Переглянути продукти
          </Link>
        </div>
      </div>
    </main>
  );
}
