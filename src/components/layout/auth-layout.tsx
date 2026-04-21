"use client";

import Image from "next/image";
import { KeyRound, MessageCircle, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function AuthLayout({ children }: Props) {
  const t = useTranslations("auth.layout");
  const benefits = [
    { icon: KeyRound, text: t("benefitOrders") },
    { icon: MessageCircle, text: t("benefitChat") },
    { icon: Shield, text: t("benefitSecure") },
  ];

  return (
    <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-2">
      {/* Decorative panel — hidden on mobile */}
      <div className="relative hidden items-center justify-center overflow-hidden lg:flex">
        <Image
          src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(92,26,26,0.80)]" />
        <div className="relative z-10 flex max-w-md flex-col items-start px-12">
          <Image
            src="/logo.png"
            alt="Svitlytsya Maystra"
            width={48}
            height={48}
            className="rounded-lg"
          />
          <h2 className="mt-6 font-display text-4xl font-bold text-white">
            {t("heading")}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            {t("subheading")}
          </p>
          <div className="mt-10 space-y-4">
            {benefits.map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <item.icon size={16} className="text-white/80" />
                </span>
                <span className="text-sm text-white/80">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-[var(--color-bg)] px-6 py-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
