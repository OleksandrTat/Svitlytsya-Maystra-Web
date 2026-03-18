"use client";

import posthog from "posthog-js";
import { env } from "@/lib/env";

let initialized = false;
const STORAGE_KEY = "cookie-consent";

function resolvePosthogApiHost(rawHost?: string) {
  if (!rawHost) {
    return null;
  }

  const trimmed = rawHost.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === "eu.posthog.com") {
      return "https://eu.i.posthog.com";
    }

    if (hostname === "app.posthog.com" || hostname === "us.posthog.com") {
      return "https://us.i.posthog.com";
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

export function initPosthog() {
  const apiHost = resolvePosthogApiHost(env.posthogHost);

  if (initialized || !env.posthogKey || !apiHost) {
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
    api_host: apiHost,
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

