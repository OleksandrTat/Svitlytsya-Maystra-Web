"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Box, Expand } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const Product3DViewer = dynamic(
  () => import("./product-3d-viewer").then((m) => m.Product3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[var(--color-surface)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    ),
  },
);

type ProductGalleryProps = {
  images: string[];
  title: string;
  model3dUrl?: string | null;
  arPlacement?: "floor" | "wall";
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

export function ProductGallery({ images, title, model3dUrl, arPlacement }: ProductGalleryProps) {
  const t = useTranslations("productPage");

  const safeImages = useMemo(
    () => images.map((item) => item.trim()).filter((item) => isSupportedImageSrc(item)),
    [images],
  );

  const trimmedModelUrl = model3dUrl?.trim() ?? "";
  const hasModel = trimmedModelUrl.length > 0;

  // active < safeImages.length means an image is selected; active === safeImages.length
  // means the 3D tile is selected (only valid when hasModel).
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const slides = useMemo(() => safeImages.map((src) => ({ src })), [safeImages]);

  const openLightboxAt = useCallback(
    (nextIndex: number) => {
      const bounded = clampIndex(nextIndex, safeImages.length);
      setLightboxIndex(bounded);
      setOpen(true);
    },
    [safeImages.length],
  );

  if (safeImages.length === 0 && !hasModel) {
    return null;
  }

  const is3dSelected = hasModel && active === safeImages.length;

  return (
    <>
      {/* Main frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-[var(--color-surface)] shadow-sm ring-1 ring-[var(--color-border)]/60 md:aspect-[5/4] lg:h-[520px] lg:aspect-auto">
        {is3dSelected ? (
          <Product3DViewer
            embedded
            modelUrl={trimmedModelUrl}
            productTitle={title}
            arPlacement={arPlacement}
            className="relative h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => openLightboxAt(active)}
            className="group/image relative block h-full w-full cursor-zoom-in"
            aria-label={t("galleryPhoto", { index: active + 1 })}
          >
            <Image
              src={safeImages[active]!}
              alt={`${title} — ${t("galleryPhoto", { index: active + 1 })}`}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover/image:scale-[1.03]"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority={active === 0}
            />

            {/* Subtle vignette */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/image:opacity-100"
            />

            {/* Zoom chip */}
            <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] opacity-0 shadow-sm backdrop-blur transition-opacity duration-200 group-hover/image:opacity-100">
              <Expand size={12} />
              {safeImages.length > 1
                ? `${active + 1} / ${safeImages.length}`
                : t("galleryPhoto", { index: active + 1 })}
            </span>
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {(safeImages.length > 1 || hasModel) && (
        <div className="mt-3 grid grid-cols-4 gap-2.5 md:grid-cols-6 md:gap-3">
          {safeImages.map((image, imageIndex) => {
            const selected = !is3dSelected && imageIndex === active;
            return (
              <button
                key={`${image}-${imageIndex}`}
                type="button"
                onClick={() => setActive(imageIndex)}
                className={cn(
                  "group/thumb relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200",
                  selected
                    ? "border-[var(--color-primary)] shadow-md"
                    : "border-transparent ring-1 ring-[var(--color-border)] hover:ring-[var(--color-primary)]/60",
                )}
                aria-label={t("galleryPhoto", { index: imageIndex + 1 })}
                aria-current={selected}
              >
                <Image
                  src={image}
                  alt={`${title} — ${t("galleryPhoto", { index: imageIndex + 1 })}`}
                  fill
                  className={cn(
                    "object-cover transition-transform duration-300 ease-out",
                    selected ? "scale-105" : "group-hover/thumb:scale-[1.04]",
                  )}
                  sizes="160px"
                  loading="lazy"
                />
                {!selected && (
                  <div className="pointer-events-none absolute inset-0 bg-white/20 transition-opacity duration-200 group-hover/thumb:bg-transparent" />
                )}
              </button>
            );
          })}

          {hasModel && (
            <button
              type="button"
              onClick={() => setActive(safeImages.length)}
              className={cn(
                "group/thumb relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200",
                is3dSelected
                  ? "border-[var(--color-primary)] shadow-md"
                  : "border-transparent ring-1 ring-[var(--color-border)] hover:ring-[var(--color-primary)]/60",
              )}
              aria-label={t("gallery3dThumbLabel")}
              aria-current={is3dSelected}
            >
              {/* Warm gradient placeholder for the 3D tile */}
              <div
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,#fff7ea_0%,#f0e2ce_55%,#e2cfb4_100%)] transition-transform duration-300 ease-out group-hover/thumb:scale-[1.04]"
                aria-hidden
              />

              {/* Cube icon centered */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-[var(--color-primary)] shadow-sm backdrop-blur transition-transform duration-200",
                    is3dSelected ? "scale-110" : "group-hover/thumb:scale-110",
                  )}
                >
                  <Box size={20} strokeWidth={1.8} />
                </div>
              </div>

              {/* 3D badge */}
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white shadow-sm">
                {t("gallery3dBadge")}
              </span>

              {!is3dSelected && (
                <div className="pointer-events-none absolute inset-0 bg-white/10 transition-opacity duration-200 group-hover/thumb:bg-transparent" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Lightbox — images only; 3D has its own viewer */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={slides}
        index={lightboxIndex}
        on={{
          view: ({ index: nextIndex }) => {
            setLightboxIndex(nextIndex);
            setActive(nextIndex);
          },
        }}
      />
    </>
  );
}
