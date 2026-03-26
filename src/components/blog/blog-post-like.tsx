"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  initialCount: number;
};

export function BlogPostLike({ slug, initialCount }: Props) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`blog-liked-${slug}`);
      if (stored === "true") setLiked(true);
    } catch {
      /* ignore */
    }
  }, [slug]);

  const handleLike = useCallback(async () => {
    if (liked) return;

    setLiked(true);
    setCount((c) => c + 1);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);

    try {
      localStorage.setItem(`blog-liked-${slug}`, "true");
    } catch {
      /* ignore */
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.rpc("toggle_blog_post_like", { post_slug: slug });
      if (typeof data === "number") setCount(data);
    } catch {
      /* optimistic — keep UI state */
    }
  }, [slug, liked]);

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={liked}
      className={cn(
        "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
        liked
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-red-300 hover:text-red-500",
      )}
    >
      <Heart
        size={18}
        className={cn(
          "transition-transform",
          liked && "fill-current",
          animating && "scale-125",
        )}
      />
      {count}
    </button>
  );
}
