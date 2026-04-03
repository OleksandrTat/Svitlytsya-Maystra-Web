import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { env, hasSupabaseEnv } from "@/lib/env";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const PUBLIC_PREFIXES = ["/auth", "/api", "/_next", "/favicon", "/robots", "/sitemap"];
const ADMIN_PREFIX = "/admin";

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAdminPath(pathname: string) {
  return pathname === ADMIN_PREFIX || pathname.startsWith(ADMIN_PREFIX + "/");
}

function isProfilePath(pathname: string) {
  const stripped = pathname.replace(/^\/(uk|en)/, "");
  return stripped === "/profile" || stripped.startsWith("/profile/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass through API / static routes unchanged
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request });
  }

  // Admin routes have no locale prefix — handle auth only
  if (isAdminPath(pathname)) {
    if (!hasSupabaseEnv) return NextResponse.next({ request });

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
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // All site routes: run intl middleware so getLocale() reads the correct locale
  const intlResponse = intlMiddleware(request);

  // If intl is redirecting (e.g. / → /uk/), honour the redirect immediately
  if (intlResponse.headers.has("location")) {
    return intlResponse;
  }

  // Profile routes also need auth
  if (isProfilePath(pathname) && hasSupabaseEnv) {
    const supabase = createServerClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            intlResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webpo)$).*)",
  ],
};
