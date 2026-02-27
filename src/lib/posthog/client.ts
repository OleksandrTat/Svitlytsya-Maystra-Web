"use client";

import posthog from "posthog-js";
import { env } from "@/lib/env";

let initialized = false;

export function initPosthog() {
  if (initialized || !env.posthogKey || !env.posthogHost) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  const consent = window.localStorage.getItem("cookie-consent");
  if (consent !== "accepted") {
    return;
  }

  posthog.init(env.posthogKey, {
    api_host: env.posthogHost,
    person_profiles: "identified_only",
    capture_pageview: false,
  });

  initialized = true;
}

