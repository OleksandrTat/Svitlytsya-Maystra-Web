"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addToWishlistAction,
  removeFromWishlistAction,
  syncWishlistFromLocalStorage,
} from "@/actions/wishlist";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { posthog } from "@/lib/posthog/client";

const STORAGE_KEY = "product_wishlist";
const WISHLIST_EVENT = "product-wishlist:change";

let didInitialSync = false;
let cachedUserPromise: Promise<{ id: string } | null> | null = null;

function getCurrentUserOnce(supabase: ReturnType<typeof createSupabaseBrowserClient>) {
  if (!cachedUserPromise) {
    cachedUserPromise = (async () => {
      try {
        const result = await supabase.auth.getUser();
        const user = result?.data?.user as { id: string } | null | undefined;
        return user ? { id: user.id } : null;
      } catch {
        return null;
      }
    })();
  }
  return cachedUserPromise;
}

function readWishlistIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

function writeWishlistIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
  window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: ids }));
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>(() => readWishlistIds());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const handleStorage = () => setIds(readWishlistIds());
    const handleCustomEvent = (event: Event) => {
      const nextIds = (event as CustomEvent<string[]>).detail;
      setIds(Array.isArray(nextIds) ? nextIds : readWishlistIds());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(WISHLIST_EVENT, handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        WISHLIST_EVENT,
        handleCustomEvent as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const checkUser = async () => {
      const user = await getCurrentUserOnce(supabase);
      setUserId(user?.id ?? null);

      if (user && !didInitialSync) {
        didInitialSync = true;
        const localIds = readWishlistIds();
        if (localIds.length > 0) {
          await syncWishlistFromLocalStorage(localIds);
        }

        const { data } = await supabase
          .from("wishlist_items")
          .select("product_id")
          .eq("user_id", user.id);

        if (data) {
          const serverIds = data.map((r: { product_id: string }) => r.product_id);
          const merged = [...new Set([...localIds, ...serverIds])];
          writeWishlistIds(merged);
          setIds(merged);
        }
      }
    };

    void checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user?: { id: string } } | null) => {
      if (session?.user) {
        setUserId(session.user.id);
        cachedUserPromise = Promise.resolve({ id: session.user.id });
      } else {
        setUserId(null);
        didInitialSync = false;
        cachedUserPromise = null;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggle = useCallback(
    (id: string, title?: string) => {
      setIds((current) => {
        const exists = current.includes(id);
        const next = exists
          ? current.filter((item) => item !== id)
          : [...current, id];

        writeWishlistIds(next);

        // Analytics
        try {
          posthog.capture(exists ? "wishlist_remove" : "wishlist_add", {
            product_id: id,
            ...(title ? { title } : {}),
          });
        } catch {}

        if (userId) {
          if (exists) {
            void removeFromWishlistAction(id);
          } else {
            void addToWishlistAction(id);
          }
        }

        return next;
      });
    },
    [userId],
  );

  const clear = useCallback(() => {
    setIds([]);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {}
      window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: [] }));
    }
  }, []);

  const idsSet = useMemo(() => new Set(ids), [ids]);

  return {
    ids,
    toggle,
    clear,
    isInWishlist: (id: string) => idsSet.has(id),
    count: ids.length,
  };
}
