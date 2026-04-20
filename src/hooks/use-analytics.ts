"use client";

/**
 * Thin wrapper around posthog.capture() for use in client components.
 *
 * Usage:
 *   const { capture } = useAnalytics();
 *   capture("product_viewed", { product_id: "…", title: "…" });
 */

import { useCallback } from "react";
import { posthog } from "@/lib/posthog/client";

// All typed events used in the app.
export type AnalyticsEvent =
  | { event: "product_viewed";       props: { product_id: string; title: string; category?: string; price?: number } }
  | { event: "wishlist_add";         props: { product_id: string; title?: string } }
  | { event: "wishlist_remove";      props: { product_id: string; title?: string } }
  | { event: "inquiry_submitted";    props: { service_type: string; has_email: boolean; source_page?: string } }
  | { event: "chat_opened";          props?: Record<string, unknown> }
  | { event: "chat_message_sent";    props: { message_index: number; used_suggestion?: boolean } }
  | { event: "search_performed";     props: { query: string; results_count?: number } }
  | { event: "filter_applied";       props: { filter_type: string; value: string } }
  | { event: "contact_cta_clicked";  props: { source: string } }
  | { event: "product_comparison_opened"; props: { count: number } };

type EventName = AnalyticsEvent["event"];
type EventProps<T extends EventName> = Extract<AnalyticsEvent, { event: T }>["props"];

export function useAnalytics() {
  const capture = useCallback(
    <T extends EventName>(
      event: T,
      ...args: EventProps<T> extends undefined ? [] : [EventProps<T>]
    ) => {
      try {
        posthog.capture(event, args[0]);
      } catch {
        // Never let analytics crash the UI
      }
    },
    [],
  );

  return { capture };
}
