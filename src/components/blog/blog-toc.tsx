"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type TocItem = { id: string; text: string; level: number };

function parseHeadings(html: string): TocItem[] {
  const regex = /<(h[23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/\1>/gi;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    items.push({
      id: match[2],
      text: match[3].replace(/<[^>]+>/g, ""),
      level: match[1] === "h2" ? 2 : 3,
    });
  }

  // Fallback: parse headings without IDs from text content
  if (items.length === 0) {
    const fallbackRegex = /<(h[23])[^>]*>(.*?)<\/\1>/gi;
    while ((match = fallbackRegex.exec(html)) !== null) {
      const text = match[2].replace(/<[^>]+>/g, "");
      const id = text
        .toLowerCase()
        .replace(/[^a-zа-яіїєґ0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "");
      items.push({
        id,
        text,
        level: match[1] === "h2" ? 2 : 3,
      });
    }
  }

  return items;
}

export function BlogTableOfContents({ content }: { content: string }) {
  const headings = useMemo(() => parseHeadings(content), [content]);
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );

    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        Зміст
      </p>
      <div className="space-y-1">
        {headings.map((heading) => (
          <button
            key={heading.id}
            type="button"
            onClick={() => scrollTo(heading.id)}
            className={cn(
              "block w-full text-left text-sm transition-colors",
              heading.level === 3 ? "pl-4" : "pl-0",
              activeId === heading.id
                ? "border-l-2 border-[var(--color-primary)] pl-2 font-medium text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
            )}
          >
            {heading.text}
          </button>
        ))}
      </div>
    </nav>
  );
}
