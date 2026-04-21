import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env, hasSupabaseEnv } from "@/lib/env";

const SUPPORTED_LOCALES = ["uk", "en"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: SupportedLocale = "uk";

function safeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }
  return nextPath;
}

function extractLocale(pathname: string): SupportedLocale {
  const match = pathname.match(/^\/(uk|en)(?=\/|$)/);
  if (match && (SUPPORTED_LOCALES as readonly string[]).includes(match[1])) {
    return match[1] as SupportedLocale;
  }
  return DEFAULT_LOCALE;
}

function buildLoginErrorUrl(origin: string, locale: SupportedLocale) {
  return new URL(`/${locale}/auth/login?error=auth_callback`, origin);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = safeNextPath(url.searchParams.get("next"));
  const locale = extractLocale(nextPath);

  if (!hasSupabaseEnv || !code) {
    return NextResponse.redirect(buildLoginErrorUrl(url.origin, locale));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(buildLoginErrorUrl(url.origin, locale));
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
