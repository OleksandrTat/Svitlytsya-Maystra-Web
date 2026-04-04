import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "uk" | "en")) {
    // Admin routes have no locale in the URL — fall back to the admin_locale cookie
    const cookieStore = await cookies();
    const adminLocale = cookieStore.get("admin_locale")?.value;
    locale =
      adminLocale && routing.locales.includes(adminLocale as "uk" | "en")
        ? adminLocale
        : routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default as Record<string, unknown>,
  };
});
