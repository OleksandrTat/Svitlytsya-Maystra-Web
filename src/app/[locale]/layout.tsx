import type { Metadata } from "next";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PostHogProvider, PostHogPageview } from "@/components/providers/posthog-provider";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://svitlytsya.ua"),
  title: {
    default: "Svitlytsya Maystra",
    template: "%s | Svitlytsya Maystra",
  },
  description:
    "Сімейна майстерня дверей, меблів і вікон на замовлення. 26+ років досвіду, індивідуальні проєкти та 3 роки гарантії.",
  openGraph: {
    title: "Svitlytsya Maystra",
    description:
      "Двері, меблі та вікна на замовлення. Індивідуальний підхід і спокійний сервіс від майстерні з 26+ роками досвіду.",
    type: "website",
    locale: "uk_UA",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "uk" | "en")) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <PostHogProvider>
      <NextIntlClientProvider messages={messages}>
        <Suspense fallback={null}>
          <PostHogPageview />
        </Suspense>
        {children}
      </NextIntlClientProvider>
    </PostHogProvider>
  );
}
