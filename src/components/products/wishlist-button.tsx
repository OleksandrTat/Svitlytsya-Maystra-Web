"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { toggle, isInWishlist } = useWishlist();
  const active = isInWishlist(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        "flex items-center justify-center rounded-full p-1.5 transition-all",
        active
          ? "bg-red-500 text-white shadow-md scale-110"
          : "bg-white/90 text-zinc-400 hover:text-red-400",
        className,
      )}
      title={active ? "Видалити з бажаного" : "Додати до бажаного"}
    >
      <Heart size={14} className={cn(active && "fill-current")} />
    </button>
  );
}
