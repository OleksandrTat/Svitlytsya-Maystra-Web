"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProjectGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="relative h-[460px] overflow-hidden rounded-3xl bg-[var(--color-surface)]">
        <Image
          src={images[active]!}
          alt={`${title} — фото ${active + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
      <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              "relative h-20 overflow-hidden rounded-xl border",
              index === active ? "border-[var(--color-primary)]" : "border-[var(--color-border)]",
            )}
          >
            <Image
              src={image}
              alt={`${title} — мініатюра ${index + 1}`}
              fill
              className="object-cover"
              sizes="120px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

