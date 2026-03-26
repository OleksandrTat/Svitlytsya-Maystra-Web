"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Facebook, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  vertical?: boolean;
};

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function BlogShareButtons({ title, vertical }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback — ignore */
    }
  }, []);

  const shareUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "";
  const shareTitle = encodeURIComponent(title);

  const buttons = [
    {
      label: copied ? "Скопійовано" : "Копіювати",
      icon: copied ? <Check size={16} /> : <Copy size={16} />,
      onClick: copyLink,
    },
    {
      label: "X",
      icon: <XIcon size={16} />,
      href: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`,
    },
    {
      label: "Facebook",
      icon: <Facebook size={16} />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
    {
      label: "Telegram",
      icon: <MessageCircle size={16} />,
      href: `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`,
    },
  ];

  return (
    <div className={cn("flex gap-2", vertical ? "flex-col" : "flex-row flex-wrap")}>
      {vertical && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          Поділитись
        </p>
      )}
      {buttons.map((btn) => {
        const className = cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]",
        );

        if ("href" in btn && btn.href) {
          return (
            <a
              key={btn.label}
              href={btn.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
              title={btn.label}
            >
              {btn.icon}
            </a>
          );
        }

        return (
          <button
            key={btn.label}
            type="button"
            onClick={btn.onClick}
            className={className}
            title={btn.label}
          >
            {btn.icon}
          </button>
        );
      })}
    </div>
  );
}
