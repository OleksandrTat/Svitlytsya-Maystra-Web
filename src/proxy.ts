import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";
import { env, hasSupabaseEnv } from "@/lib/env";

const intlMiddleware = createIntlMiddleware(routing);

// Paths that bypass locale handling entirely
const BYPASS_PREFIXES = ["/admin", "/api", "/auth/callback", "/_next"];
const STATIC_EXTENSIONS = /\.(svg|png|ico|jpg|jpeg|webp|gif|woff2?|ttf|eot|css|js|map)$/;

function isBypassed(pathname: string): boolean {
  if (STATIC_EXTENSIONS.test(pathname)) return true;
  return BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// Profile paths that require auth: /uk/profile/* or /en/profile/*
const PROFILE_PATTERN = /^\/(uk|en)\/profile(\/|$)/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isBypassed(pathname)) {
    return NextResponse.next({ request });
  }

  // Auth check for /[locale]/profile/*
  if (PROFILE_PATTERN.test(pathname)) {
    if (!hasSupabaseEnv) {
      return intlMiddleware(request);
    }

    const response = NextResponse.next({ request });
    const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const locale = pathname.split("/")[1] ?? "uk";
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${locale}/auth/login`;
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
