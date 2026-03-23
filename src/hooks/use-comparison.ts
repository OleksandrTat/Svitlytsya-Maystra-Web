"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "product_comparison";
const MAX_COMPARE = 3;
const COMPARISON_EVENT = "product-comparison:change";

function readComparisonIds() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

function writeComparisonIds(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}

  window.dispatchEvent(new CustomEvent(COMPARISON_EVENT, { detail: ids }));
}

export function useComparison() {
  const [ids, setIds] = useState<string[]>(() => readComparisonIds());

  useEffect(() => {
    const handleStorage = () => setIds(readComparisonIds());
    const handleCustomEvent = (event: Event) => {
      const nextIds = (event as CustomEvent<string[]>).detail;
      setIds(Array.isArray(nextIds) ? nextIds : readComparisonIds());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(COMPARISON_EVENT, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(COMPARISON_EVENT, handleCustomEvent as EventListener);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < MAX_COMPARE
          ? [...current, id]
          : current;

      writeComparisonIds(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIds([]);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {}
      window.dispatchEvent(new CustomEvent(COMPARISON_EVENT, { detail: [] }));
    }
  }, []);

  const idsSet = useMemo(() => new Set(ids), [ids]);

  return {
    ids,
    toggle,
    clear,
    isInComparison: (id: string) => idsSet.has(id),
    isFull: ids.length >= MAX_COMPARE,
    count: ids.length,
  };
}
