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
    <main className="min-h-screen bg-[var(--color-background)] px-6 py-16">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
        <p className="font-display text-8xl text-[var(--color-secondary)] select-none">404</p>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--color-text-primary)]">
          Сторінку не знайдено
        </h1>
        <p className="mt-3 max-w-xl text-base text-[var(--color-text-secondary)]">
          Схоже, ця сторінка була переміщена або її ніколи не існувало.
          Перейдіть на головну або перегляньте каталог робіт.
        </p>

        <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]"
          >
            На головну
          </Link>
          <Link
            href="/catalog"
            className="rounded-full border border-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-surface)]"
          >
            Переглянути роботи
          </Link>
        </div>
      </div>
    </main>
  );
}
