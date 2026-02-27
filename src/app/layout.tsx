import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://svitlytsya.ua"),
  title: {
    default: "Svitlytsya Maystra",
    template: "%s | Svitlytsya Maystra",
  },
  description:
    "Сімейна майстерня дверей, меблів і вікон. 26+ років досвіду, індивідуальні проєкти та гарантія якості.",
  openGraph: {
    title: "Svitlytsya Maystra",
    description:
      "Двері, меблі та вікна під ключ. Індивідуальний підхід і спокійний сервіс від майстерні з 26+ роками досвіду.",
    type: "website",
    locale: "uk_UA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={`${manrope.variable} ${playfair.variable} antialiased`}>{children}</body>
    </html>
  );
}

