import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Рейтинг: ${rating} з 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-4 w-4",
            index < rating ? "fill-[var(--color-secondary)] text-[var(--color-secondary)]" : "text-zinc-300",
          )}
        />
      ))}
    </div>
  );
}

