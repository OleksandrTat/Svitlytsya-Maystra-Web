"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Info, RotateCcw, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

type ModelViewerInstance = HTMLElement & {
  resetTurntableRotation?: () => void;
};

type Props = {
  modelUrl: string;
  posterUrl?: string;
  productTitle: string;
  arPlacement?: "wall" | "floor";
};

export function Product3DViewer({
  modelUrl,
  posterUrl,
  productTitle,
  arPlacement = "wall",
}: Props) {
  const viewerRef = useRef<ModelViewerInstance | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isARSupported, setIsARSupported] = useState(false);
  const [showTip, setShowTip] = useState(true);

  useEffect(() => {
    void import("@google/model-viewer");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isMobile = /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
    setIsARSupported(isMobile);
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }

    const handleLoad = () => {
      setIsLoaded(true);
      setIsLoading(false);
      window.setTimeout(() => setShowTip(false), 3000);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);

    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
    };
  }, [modelUrl]);

  if (hasError) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="text-center">
          <Box size={32} className="mx-auto text-[var(--color-border)]" />
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            3D-модель недоступна
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box size={16} className="text-[var(--color-primary)]" />
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">3D-перегляд</p>
        </div>
        {isARSupported ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <Smartphone size={10} />
            AR доступний
          </span>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-surface)]">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                Завантаження 3D-моделі...
              </p>
            </div>
          </div>
        ) : null}

        {isLoaded && showTip ? (
          <div className="absolute bottom-14 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
            Перетягніть для обертання · Прокрутіть для масштабу
          </div>
        ) : null}

        <model-viewer
          ref={viewerRef}
          src={modelUrl}
          poster={posterUrl}
          alt={`3D модель: ${productTitle}`}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement={arPlacement}
          camera-controls
          auto-rotate
          auto-rotate-delay="3000"
          rotation-per-second="20deg"
          shadow-intensity="1"
          shadow-softness="0.8"
          environment-image="neutral"
          exposure="0.9"
          loading="eager"
          reveal="auto"
          interaction-prompt="auto"
          className="h-[420px] w-full bg-transparent"
        >
          <button
            slot="ar-button"
            className={cn(
              "absolute bottom-4 right-4 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg transition",
              "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-700)]",
            )}
          >
            <Smartphone size={16} />
            Переглянути в AR
          </button>
        </model-viewer>

        {isLoaded ? (
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => viewerRef.current?.resetTurntableRotation?.()}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white"
              title="Скинути вигляд"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        ) : null}
      </div>

      {isARSupported && isLoaded ? (
        <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3">
          <Info size={14} className="mt-0.5 shrink-0 text-sky-600" />
          <p className="text-xs text-sky-700">
            Натисніть <strong>&quot;Переглянути в AR&quot;</strong>, щоб розмістити{" "}
            {arPlacement === "wall" ? "двері на стіні" : "виріб у своєму просторі"} за допомогою
            камери.
          </p>
        </div>
      ) : null}

      {!isARSupported && isLoaded ? (
        <p className="text-center text-xs text-[var(--color-text-secondary)]">
          Відкрийте на смартфоні, щоб використати AR-перегляд
        </p>
      ) : null}
    </div>
  );
}
