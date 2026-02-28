"use client";

import { useReducedMotion } from "framer-motion";

export function useMotionConfig() {
  const shouldReduceMotion = useReducedMotion();

  return {
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { duration: 0.5, ease: "easeOut" as const },
    stagger: shouldReduceMotion ? 0 : 0.08,
    shouldReduceMotion,
  };
}
