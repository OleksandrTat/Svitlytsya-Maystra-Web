import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${cormorant.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

