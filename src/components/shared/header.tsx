"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Головна" },
  { href: "/catalog", label: "Роботи" },
  { href: "/services", label: "Послуги" },
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

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-primary)]">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/admin/login" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
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

      <div className={cn("border-t border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 md:hidden", open ? "block" : "hidden")}>
        <div className="flex flex-col gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-[var(--color-text-secondary)]" onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href="/contact" onClick={() => setOpen(false)}>
            <Button className="w-full">Отримати розрахунок</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

