"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { posthog } from "@/lib/posthog/client";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// Use the /ingest proxy to bypass ad-blockers. Falls back to direct host.
const POSTHOG_HOST =
  typeof window !== "undefined"
    ? `${window.location.origin}/ingest`
    : "/ingest";

// ─── Initialisation ──────────────────────────────────────────────────────────

let initialized = false;

function initPostHog() {
  if (initialized || !POSTHOG_KEY || typeof window === "undefined") return;
  initialized = true;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: "https://us.posthog.com",
    // Capture the very first pageview once init fires; subsequent ones
    // are handled manually by PageviewTracker below.
    capture_pageview: false,
    // Session recordings
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: { password: true },
    },
    // Don't load yet if the user hasn't given consent (change to true
    // if you have a consent banner that sets a cookie/flag first).
    persistence: "localStorage+cookie",
    // Respect Do-Not-Track
    respect_dnt: true,
    loaded(ph) {
      if (process.env.NODE_ENV === "development") {
        ph.debug();
      }
    },
  });
}

// ─── Pageview tracker ────────────────────────────────────────────────────────

/**
 * Tracks a $pageview on every route change.
 * Must be wrapped in <Suspense> because useSearchParams() suspends.
 */
export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrl = useRef<string>("");

  useEffect(() => {
    const url =
      pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

    if (url === lastUrl.current) return;
    lastUrl.current = url;

    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname, searchParams]);

  return null;
}

// ─── User identification ──────────────────────────────────────────────────────

/**
 * Identifies the logged-in user with PostHog once per session.
 * Resets the anonymous identity on sign-out.
 */
function PostHogIdentity() {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const identify = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        posthog.identify(user.id, {
          email: user.email,
          created_at: user.created_at,
        });
      }
    };

    void identify();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user?: { id: string; email?: string; created_at?: string } } | null) => {
      if (_event === "SIGNED_IN" && session?.user) {
        posthog.identify(session.user.id, {
          email: session.user.email,
          created_at: session.user.created_at,
        });
      }

      if (_event === "SIGNED_OUT") {
        posthog.reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

// ─── Main provider ────────────────────────────────────────────────────────────

/**
 * Drop this into the root layout.
 * It initialises PostHog, tracks pageviews, and identifies authenticated users.
 *
 * Wrap PostHogPageview in <Suspense> at the call-site because it uses
 * useSearchParams(), which requires a Suspense boundary in App Router.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <PostHogIdentity />
    </>
  );
}
