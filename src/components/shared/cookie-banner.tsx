"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { initPosthog } from "@/lib/posthog/client";

const STORAGE_KEY = "cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !window.localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "accepted") {
      initPosthog();
    }
  }, []);

  const handleConsent = (value: "accepted" | "declined") => {
    window.localStorage.setItem(STORAGE_KEY, value);
    if (value === "accepted") {
      initPosthog();
    }
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-3xl border border-[var(--color-border)] bg-white p-4 shadow-xl md:left-auto md:max-w-md">
      <p className="text-sm text-[var(--color-text-secondary)]">
        Ми використовуємо cookies для базової роботи сайту та аналітики PostHog. Ви можете відмовитися від аналітичних cookies.
      </p>
      <div className="mt-4 flex gap-2">
        <Button onClick={() => handleConsent("accepted")} className="flex-1">
          Прийняти
        </Button>
        <Button variant="secondary" onClick={() => handleConsent("declined")} className="flex-1">
          Відхилити
        </Button>
      </div>
    </div>
  );
}

