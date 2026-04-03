"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  isTransparent?: boolean;
  className?: string;
}

export function LanguageSwitcher({ isTransparent, className }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (next: "uk" | "en") => {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-lg border p-0.5",
        isTransparent
          ? "border-white/30"
          : "border-[var(--color-border)]",
        className,
      )}
    >
      {(["uk", "en"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => switchLocale(lang)}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-semibold uppercase transition",
            locale === lang
              ? isTransparent
                ? "bg-white/20 text-white"
                : "bg-[var(--color-surface)] text-[var(--color-primary)]"
              : isTransparent
                ? "text-white/60 hover:text-white"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
