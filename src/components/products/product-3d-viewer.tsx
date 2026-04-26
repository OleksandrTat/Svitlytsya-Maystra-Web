"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";
import { Box, RotateCcw, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type Props = {
  modelUrl: string;
  productTitle: string;
  arPlacement?: "floor" | "wall";
  /**
   * When true the viewer is rendered inside the gallery frame and fills the
   * parent container without its own section chrome.
   */
  embedded?: boolean;
  className?: string;
};

type ViewerState = "loading" | "ready" | "error";
type ProgressDetail = { totalProgress?: number };

const AR_DEVICE_PATTERN = /android|iphone|ipad|ipod/i;
const DEFAULT_CAMERA_ORBIT = "32deg 72deg 110%";
const DEFAULT_CAMERA_TARGET = "auto auto auto";
const DEFAULT_FIELD_OF_VIEW = "30deg";
const MODEL_VIEWER_RUNTIME_SRC = "/vendor/model-viewer.min.js";

let modelViewerRuntimePromise: Promise<void> | null = null;

function ensureModelViewerRuntime() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (customElements.get("model-viewer")) {
    return Promise.resolve();
  }

  if (modelViewerRuntimePromise) {
    return modelViewerRuntimePromise;
  }

  modelViewerRuntimePromise = new Promise<void>((resolve, reject) => {
    const runtimeUrl = new URL(MODEL_VIEWER_RUNTIME_SRC, window.location.origin).toString();
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-model-viewer-runtime="true"]`,
    );

    const finish = () => {
      customElements
        .whenDefined("model-viewer")
        .then(() => resolve())
        .catch(reject);
    };

    if (existingScript) {
      if (existingScript.src !== runtimeUrl) {
        existingScript.remove();
      } else {
        if (customElements.get("model-viewer")) {
          resolve();
          return;
        }

        existingScript.addEventListener("load", finish, { once: true });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Failed to load model-viewer runtime.")),
          { once: true },
        );
        return;
      }
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = runtimeUrl;
    script.dataset.modelViewerRuntime = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load model-viewer runtime.")),
      { once: true },
    );
    document.head.appendChild(script);
  }).catch((error) => {
    modelViewerRuntimePromise = null;
    throw error;
  });

  return modelViewerRuntimePromise;
}

function resetViewerCamera(viewer: ModelViewerElement | null) {
  if (!viewer) {
    return;
  }

  viewer.cameraOrbit = DEFAULT_CAMERA_ORBIT;
  viewer.cameraTarget = DEFAULT_CAMERA_TARGET;
  viewer.fieldOfView = DEFAULT_FIELD_OF_VIEW;
  viewer.jumpCameraToGoal();
}

function ModelCanvas({
  viewerRef,
  modelUrl,
  productTitle,
  arPlacement,
}: {
  viewerRef: React.RefObject<ModelViewerElement | null>;
  modelUrl: string;
  productTitle: string;
  arPlacement: "floor" | "wall";
}) {
  return (
    <model-viewer
      key={modelUrl}
      ref={viewerRef}
      src={modelUrl}
      alt={productTitle}
      ar
      ar-modes="webxr scene-viewer quick-look"
      ar-placement={arPlacement}
      loading="eager"
      reveal="auto"
      camera-controls
      interaction-prompt="none"
      touch-action="pan-y"
      xr-environment
      camera-orbit={DEFAULT_CAMERA_ORBIT}
      camera-target={DEFAULT_CAMERA_TARGET}
      field-of-view={DEFAULT_FIELD_OF_VIEW}
      environment-image="neutral"
      shadow-intensity="1"
      exposure="1"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: "transparent",
      }}
    />
  );
}

export function Product3DViewer({
  modelUrl,
  productTitle,
  arPlacement = "floor",
  embedded = false,
  className,
}: Props) {
  const t = useTranslations("productPage");
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>("loading");
  const [progress, setProgress] = useState(0);
  const [isViewerRuntimeReady, setIsViewerRuntimeReady] = useState(false);
  const [isArEligibleDevice, setIsArEligibleDevice] = useState(false);
  const [isArReady, setIsArReady] = useState(false);
  const [isArLaunching, setIsArLaunching] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isEligibleDevice =
      window.isSecureContext && AR_DEVICE_PATTERN.test(window.navigator.userAgent);

    setIsArEligibleDevice(isEligibleDevice);
    setIsArReady(false);

    let cancelled = false;

    void ensureModelViewerRuntime()
      .then(() => {
        if (cancelled) {
          return;
        }

        setIsViewerRuntimeReady(true);
        setIsArReady(isEligibleDevice);
      })
      .catch((error) => {
        console.error("Failed to load model-viewer runtime", error);
        if (!cancelled) {
          setViewerState("error");
          setIsArEligibleDevice(false);
          setIsArReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setViewerState("loading");
    setProgress(0);
  }, [modelUrl]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !isViewerRuntimeReady) {
      return;
    }

    const handleLoad = () => {
      resetViewerCamera(viewer);
      setProgress(100);
      setViewerState("ready");
    };

    const handleError = () => {
      setViewerState("error");
    };

    const handleProgress = (event: Event) => {
      const detail = (event as CustomEvent<ProgressDetail>).detail;
      const totalProgress = detail?.totalProgress;
      if (typeof totalProgress === "number") {
        setProgress(Math.min(100, Math.round(totalProgress * 100)));
      }
    };

    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);
    viewer.addEventListener("progress", handleProgress as EventListener);

    if (viewer.loaded) {
      handleLoad();
    }

    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
      viewer.removeEventListener("progress", handleProgress as EventListener);
    };
  }, [isViewerRuntimeReady, modelUrl]);

  const handleResetView = () => {
    resetViewerCamera(viewerRef.current);
  };

  const handleActivateAr = async () => {
    const viewer = viewerRef.current;
    if (!viewer) {
      toast.error(t("arNotReady"));
      return;
    }

    if (!viewer.canActivateAR) {
      toast.error(t("arUnsupported"));
      return;
    }

    setIsArLaunching(true);

    try {
      await viewer.activateAR();
    } catch (error) {
      console.error("Failed to activate AR", error);
      toast.error(t("arError"));
    } finally {
      setIsArLaunching(false);
    }
  };

  if (viewerState === "error") {
    return (
      <div
        className={
          className ??
          "flex h-72 items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]"
        }
      >
        <div className="text-center">
          <Box size={32} className="mx-auto text-[var(--color-border)]" />
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {t("model3dError")}
          </p>
        </div>
      </div>
    );
  }

  if (embedded) {
    return (
      <div className={className ?? "relative h-full w-full"}>
        {isViewerRuntimeReady ? (
          <ModelCanvas
            viewerRef={viewerRef}
            modelUrl={modelUrl}
            productTitle={productTitle}
            arPlacement={arPlacement}
          />
        ) : (
          <div className="h-full w-full" />
        )}

        {viewerState === "loading" ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-surface)]/82 backdrop-blur-sm">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                {progress > 0
                  ? t("model3dLoadingProgress", { progress })
                  : `${t("model3dLoading")}…`}
              </p>
            </div>
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 top-3 flex items-center justify-between px-3">
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)] shadow-sm backdrop-blur">
            <Box size={12} />
            {t("gallery3dBadge")}
          </span>

          <button
            type="button"
            onClick={handleResetView}
            disabled={viewerState !== "ready"}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-secondary)] shadow-sm backdrop-blur transition hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={12} />
            {t("model3dResetView")}
          </button>
        </div>

        {isArEligibleDevice ? (
          <button
            type="button"
            onClick={handleActivateAr}
            disabled={!isArReady || isArLaunching || viewerState !== "ready"}
            className="pointer-events-auto absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[var(--color-primary-700)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Smartphone size={14} />
            {isArLaunching
              ? t("arLaunching")
              : isArReady
                ? t("arButton")
                : t("arPreparing")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className ?? "relative space-y-3"}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Box size={16} className="text-[var(--color-primary)]" />
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {t("model3dTitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isArEligibleDevice ? (
            <button
              type="button"
              onClick={handleActivateAr}
              disabled={!isArReady || isArLaunching || viewerState !== "ready"}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Smartphone size={12} />
              {isArLaunching
                ? t("arLaunching")
                : isArReady
                  ? t("arButton")
                  : t("arPreparing")}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleResetView}
            disabled={viewerState !== "ready"}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={12} />
            {t("model3dResetView")}
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[radial-gradient(circle_at_top,#fff7ee_0%,#f4ebdf_55%,#eadfce_100%)]">
        <div className="h-[480px] w-full" aria-label={productTitle}>
          {isViewerRuntimeReady ? (
            <ModelCanvas
              viewerRef={viewerRef}
              modelUrl={modelUrl}
              productTitle={productTitle}
              arPlacement={arPlacement}
            />
          ) : null}
        </div>

        {viewerState === "loading" ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-surface)]/82 backdrop-blur-sm">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                {progress > 0
                  ? t("model3dLoadingProgress", { progress })
                  : `${t("model3dLoading")}…`}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <p className="text-center text-xs text-[var(--color-text-secondary)]">
        {t("model3dHint")}
      </p>

      {isArEligibleDevice ? (
        <p className="text-center text-[11px] text-[var(--color-text-secondary)]">
          {t("arHint")}
        </p>
      ) : null}
    </div>
  );
}
