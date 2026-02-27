"use client";

import posthog from "posthog-js";
import { env } from "@/lib/env";

let initialized = false;
const STORAGE_KEY = "cookie-consent";

export function initPosthog() {
  if (initialized || !env.posthogKey || !env.posthogHost) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  const consent = window.localStorage.getItem(STORAGE_KEY);
  if (consent !== "accepted") {
    return;
  }

  posthog.init(env.posthogKey, {
    api_host: env.posthogHost,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
  });

  initialized = true;
}

export function hasAnalyticsConsent() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) === "accepted";
}

export function capturePosthogEvent(event: string, properties?: Record<string, unknown>) {
  if (!hasAnalyticsConsent()) {
    return;
  }

  initPosthog();

  if (!posthog.__loaded) {
    return;
  }

  posthog.capture(event, properties);
}

export function optOutPosthog() {
  if (typeof window === "undefined") {
    return;
  }

  posthog.opt_out_capturing();
}

