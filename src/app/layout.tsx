import type { ReactNode } from "react";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"

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

export default async function RootLayout({ children }: { children: ReactNode }) {
  // getLocale reads the x-next-intl-locale header set by the proxy.
  // Falls back to "uk" for admin / non-locale routes.
  let locale = "uk";
  try {
    locale = await getLocale();
  } catch {
    // admin or routes outside intl scope — default to "uk"
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${cormorant.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
