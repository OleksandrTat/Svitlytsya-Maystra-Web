"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Section = {
  id: string;
  title: string;
};

type Props = {
  title: string;
  lastUpdated: string;
  sections: Section[];
  children: ReactNode;
};

export function LegalPageLayout({ title, lastUpdated, sections, children }: Props) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTocOpen(false);
  };

  return (
    <>
      {/* Compact hero */}
      <section className="bg-[var(--color-bg-dark)] py-12 md:py-16">
        <Container>
          <h1 className="font-display text-3xl font-bold text-white md:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-white/50">
            Останнє оновлення: {lastUpdated}
          </p>
        </Container>
      </section>

      <section className="py-10 md:py-14">
        <Container>
          {/* Mobile ToC toggle */}
          <div className="mb-6 lg:hidden">
            <button
              type="button"
              onClick={() => setTocOpen(!tocOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium"
            >
              Зміст
              <ChevronDown
                size={16}
                className={cn("transition-transform", tocOpen && "rotate-180")}
              />
            </button>
            {tocOpen && (
              <nav className="mt-2 rounded-xl border border-[var(--color-border)] bg-white p-3">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollTo(section.id)}
                    className={cn(
                      "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      activeSection === section.id
                        ? "bg-[var(--color-primary-100)] font-medium text-[var(--color-primary)]"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]",
                    )}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            )}
          </div>

          <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
            {/* Desktop ToC */}
            <nav className="sticky top-24 hidden h-fit lg:block">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                Зміст
              </p>
              <div className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollTo(section.id)}
                    className={cn(
                      "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      activeSection === section.id
                        ? "border-l-2 border-[var(--color-primary)] pl-[10px] font-medium text-[var(--color-primary)]"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
                    )}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </nav>

            {/* Content */}
            <div className="prose max-w-none text-[var(--color-text-secondary)] prose-headings:font-display prose-headings:text-[var(--color-text-primary)] prose-h2:text-2xl prose-h3:text-lg prose-p:leading-relaxed">
              {children}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
