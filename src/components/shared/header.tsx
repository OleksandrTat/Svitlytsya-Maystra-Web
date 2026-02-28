"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Головна" },
  { href: "/catalog", label: "Каталог" },
  { href: "/services", label: "Послуги" },
  { href: "/blog", label: "Блог" },
  { href: "/cultural", label: "Культурний блог" },
  { href: "/contact", label: "Контакти" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-[1280px] items-center justify-between px-4 md:px-6">
        <Link href="/" className="font-display text-xl text-[var(--color-primary)]">
          Svitlytsya Maystra
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/auth/login"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          >
            Увійти
          </Link>
          <Link
            href="/admin"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          >
            Адмін
          </Link>
          <Link href="/contact">
            <Button className="h-10 px-5 text-xs">Отримати розрахунок</Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)] md:hidden"
          aria-label="Відкрити меню"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--color-text-secondary)]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/auth/login" onClick={() => setOpen(false)}>
              <Button variant="secondary" className="w-full">
                Увійти
              </Button>
            </Link>
            <Link href="/admin" onClick={() => setOpen(false)}>
              <Button variant="secondary" className="w-full">
                Адмін
              </Button>
            </Link>
          </div>
          <Link href="/contact" onClick={() => setOpen(false)}>
            <Button className="w-full">Отримати розрахунок</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
