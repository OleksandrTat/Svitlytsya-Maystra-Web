"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: string[];
  title: string;
};

function isSupportedImageSrc(value: string) {
  const src = value.trim();
  return (
    src.startsWith("/") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  );
}

function clampIndex(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  if (index < 0) {
    return 0;
  }

  if (index >= length) {
    return length - 1;
  }

  return index;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const safeImages = useMemo(
    () => images.map((item) => item.trim()).filter((item) => isSupportedImageSrc(item)),
    [images],
  );
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const slides = useMemo(() => safeImages.map((src) => ({ src })), [safeImages]);

  const openAt = useCallback((nextIndex: number) => {
    setActive(nextIndex);
    setIndex(nextIndex);
    setOpen(true);
  }, []);

  if (safeImages.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="relative h-[460px] cursor-zoom-in overflow-hidden rounded-3xl bg-[var(--color-surface)]"
        onClick={() => openAt(clampIndex(active, safeImages.length))}
      >
        <Image
          src={safeImages[active]!}
          alt={`${title} - photo ${active + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={true}
        />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-3 md:grid-cols-6">
        {safeImages.map((image, imageIndex) => (
          <button
            key={`${image}-${imageIndex}`}
            type="button"
            onClick={() => openAt(imageIndex)}
            className={cn(
              "relative h-20 cursor-zoom-in overflow-hidden rounded-xl border",
              imageIndex === active
                ? "border-[var(--color-primary)]"
                : "border-[var(--color-border)]",
            )}
          >
            <Image
              src={image}
              alt={`${title} - thumbnail ${imageIndex + 1}`}
              fill
              className="object-cover"
              sizes="120px"
              loading="lazy"
              priority={false}
            />
          </button>
        ))}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={slides}
        index={index}
        on={{
          view: ({ index: nextIndex }) => {
            setActive(nextIndex);
            setIndex(nextIndex);
          },
        }}
      />
    </>
  );
}
