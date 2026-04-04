"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminLanguageSwitcher({ collapsed }: { collapsed: boolean }) {
  const locale = useLocale();
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;
    document.cookie = `admin_locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    router.refresh();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        collapsed ? "justify-center" : "",
      )}
    >
      {(["uk", "en"] as const).map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          className={cn(
            "rounded px-2 py-1 text-xs font-medium uppercase transition",
            locale === loc
              ? "bg-white/20 text-[color:var(--color-on-primary)]"
              : "text-[color:var(--color-on-primary-muted)] hover:bg-white/10 hover:text-[color:var(--color-on-primary)]",
          )}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
