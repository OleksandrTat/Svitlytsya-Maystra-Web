import posthog from "posthog-js";

// Re-export the posthog instance so the rest of the app always
// imports from one place and never imports posthog-js directly.
export { posthog };

export type { PostHog } from "posthog-js";
