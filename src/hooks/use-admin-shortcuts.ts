"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type AdminShortcutsOptions = {
  onTogglePalette: () => void;
  onToggleHelp: () => void;
};

function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) {
    return false;
  }

  const tag = element.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }

  return element.isContentEditable;
}

const goToRoutes: Record<string, string> = {
  d: "/admin",
  o: "/admin/orders",
  i: "/admin/inquiries",
  c: "/admin/clients",
  m: "/admin/inbox",
  b: "/admin/blog",
};

export function useAdminShortcuts({ onTogglePalette, onToggleHelp }: AdminShortcutsOptions) {
  const router = useRouter();
  const gBuffer = useRef<string[]>([]);
  const gTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetBuffer = () => {
      gBuffer.current = [];
      if (gTimeout.current) {
        clearTimeout(gTimeout.current);
        gTimeout.current = null;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onTogglePalette();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault();
        onToggleHelp();
        return;
      }

      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        onToggleHelp();
        return;
      }

      if (gBuffer.current[0] === "g") {
        const route = goToRoutes[event.key.toLowerCase()];
        if (route) {
          event.preventDefault();
          router.push(route);
          resetBuffer();
        }
        return;
      }

      if (event.key.toLowerCase() === "g") {
        gBuffer.current = ["g"];
        if (gTimeout.current) {
          clearTimeout(gTimeout.current);
        }
        gTimeout.current = setTimeout(() => {
          resetBuffer();
        }, 1000);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (gTimeout.current) {
        clearTimeout(gTimeout.current);
      }
    };
  }, [onToggleHelp, onTogglePalette, router]);
}

