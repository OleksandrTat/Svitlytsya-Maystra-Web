"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";
import { Box, RotateCcw, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ACESFilmicToneMapping,
  Box3,
  Clock,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PMREMGenerator,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

type Props = {
  modelUrl: string;
  productTitle: string;
  arPlacement?: "floor" | "wall";
  /**
   * When true the viewer is rendered inside the gallery frame — removes its own
   * header / hint text and fills the parent container.
   */
  embedded?: boolean;
  className?: string;
};

type ViewerState = "loading" | "ready" | "error";

type ViewerRuntime = {
  camera: PerspectiveCamera;
  controls: OrbitControls;
  renderFrame: () => void;
  focusModel: () => void;
};

const AR_DEVICE_PATTERN = /android|iphone|ipad|ipod/i;

function isMesh(value: Object3D): value is Mesh {
  return "isMesh" in value && Boolean(value.isMesh);
}

function disposeObject(root: Object3D) {
  root.traverse((child: Object3D) => {
    if (!isMesh(child)) {
      return;
    }

    child.geometry.dispose();

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      material.dispose();
    }
  });
}

function prepareStandardMaterial(material: MeshStandardMaterial, maxAnisotropy: number) {
  const textureMaps = [
    material.map,
    material.emissiveMap,
    material.normalMap,
    material.roughnessMap,
    material.metalnessMap,
    material.aoMap,
    material.alphaMap,
    material.bumpMap,
  ].filter((texture): texture is Texture => texture !== null);

  for (const texture of textureMaps) {
    texture.anisotropy = Math.max(texture.anisotropy, maxAnisotropy);
  }

  if (material.map) {
    material.map.colorSpace = SRGBColorSpace;
    material.map.needsUpdate = true;
  }

  if (material.emissiveMap) {
    material.emissiveMap.colorSpace = SRGBColorSpace;
    material.emissiveMap.needsUpdate = true;
  }

  const isSuspiciousTexturedPbrExport =
    Boolean(material.map) &&
    !material.metalnessMap &&
    !material.roughnessMap &&
    material.metalness >= 0.95 &&
    material.roughness >= 0.95;

  if (isSuspiciousTexturedPbrExport) {
    material.metalness = 0.08;
    material.roughness = 0.9;
  }

  const hasAnyTextureMap = textureMaps.length > 0;
  const fallbackName = material.name.trim().toLowerCase();
  const isFallbackBlackMaterial =
    fallbackName.includes("fallback") &&
    !hasAnyTextureMap &&
    material.color.r <= 0.02 &&
    material.color.g <= 0.02 &&
    material.color.b <= 0.02;

  if (isFallbackBlackMaterial) {
    material.color.set("#efe8df");
    material.roughness = 0.86;
    material.metalness = 0.04;
  }

  material.needsUpdate = true;
}

function prepareModel(root: Object3D, maxAnisotropy: number) {
  root.traverse((child: Object3D) => {
    if (!isMesh(child)) {
      return;
    }

    child.castShadow = true;
    child.receiveShadow = true;

    if (!child.geometry.attributes.normal) {
      child.geometry.computeVertexNormals();
    }

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (material instanceof MeshStandardMaterial) {
        prepareStandardMaterial(material, maxAnisotropy);
      } else {
        material.needsUpdate = true;
      }
    }
  });
}

function fitCameraToObject(camera: PerspectiveCamera, controls: OrbitControls, object: Object3D) {
  const box = new Box3().setFromObject(object);
  if (box.isEmpty()) {
    return;
  }

  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.25);
  const fov = (camera.fov * Math.PI) / 180;
  const distance = (maxDimension / (2 * Math.tan(fov / 2))) * 1.8;
  const direction = new Vector3(1, 0.55, 1).normalize();

  camera.position.copy(center).add(direction.multiplyScalar(distance));
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = Math.max(distance * 25, 100);
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.minDistance = Math.max(maxDimension * 0.45, 0.5);
  controls.maxDistance = Math.max(maxDimension * 9, 8);
  controls.update();
}

function setRendererSize(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
  container: HTMLDivElement,
) {
  const width = Math.max(container.clientWidth, 1);
  const height = Math.max(container.clientHeight, 1);

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

export function Product3DViewer({
  modelUrl,
  productTitle,
  arPlacement = "floor",
  embedded = false,
  className,
}: Props) {
  const t = useTranslations("productPage");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<ViewerRuntime | null>(null);
  const arViewerRef = useRef<ModelViewerElement | null>(null);
  const [viewerState, setViewerState] = useState<ViewerState>("loading");
  const [progress, setProgress] = useState(0);
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

    if (!isEligibleDevice) {
      return;
    }

    let cancelled = false;

    void import("@google/model-viewer")
      .then(() => customElements.whenDefined("model-viewer"))
      .then(() => {
        if (!cancelled) {
          setIsArReady(true);
        }
      })
      .catch((error) => {
        console.error("Failed to load model-viewer AR runtime", error);
        if (!cancelled) {
          setIsArEligibleDevice(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let isDisposed = false;
    let currentModel: Group | null = null;

    const scene = new Scene();
    scene.background = new Color("#f2eadf");

    const camera = new PerspectiveCamera(36, 1, 0.1, 1000);
    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.domElement.className = "h-full w-full";
    const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const pmremGenerator = new PMREMGenerator(renderer);
    const environmentTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = environmentTarget.texture;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.screenSpacePanning = false;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.48;

    const hemiLight = new HemisphereLight("#fff5e6", "#7b624f", 1.7);
    scene.add(hemiLight);

    const keyLight = new DirectionalLight("#fff8ef", 2.6);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const fillLight = new DirectionalLight("#f5e6d3", 1.2);
    fillLight.position.set(-5, 3, -4);
    scene.add(fillLight);

    const loader = new GLTFLoader();
    loader.setCrossOrigin("anonymous");

    const clock = new Clock();

    const renderFrame = () => {
      if (isDisposed) {
        return;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    const animationLoop = () => {
      if (isDisposed) {
        return;
      }

      clock.getDelta();
      renderFrame();
      window.requestAnimationFrame(animationLoop);
    };

    const focusModel = () => {
      if (!currentModel) {
        return;
      }

      fitCameraToObject(camera, controls, currentModel);
      renderFrame();
    };

    runtimeRef.current = {
      camera,
      controls,
      renderFrame,
      focusModel,
    };

    const handleResize = () => {
      setRendererSize(renderer, camera, container);
      renderFrame();
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    loader.load(
      modelUrl,
      (gltf: GLTF) => {
        if (isDisposed) {
          return;
        }

        currentModel = gltf.scene;
        prepareModel(currentModel, maxAnisotropy);
        scene.add(currentModel);
        focusModel();
        setProgress(100);
        setViewerState("ready");
      },
      (event: ProgressEvent<EventTarget>) => {
        if (isDisposed) {
          return;
        }

        if (event.total > 0) {
          setProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
        }
      },
      () => {
        if (!isDisposed) {
          setViewerState("error");
        }
      },
    );

    window.requestAnimationFrame(animationLoop);

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
      controls.dispose();
      runtimeRef.current = null;

      if (currentModel) {
        scene.remove(currentModel);
        disposeObject(currentModel);
      }

      renderer.dispose();
      environmentTarget.dispose();
      pmremGenerator.dispose();
      container.innerHTML = "";
    };
  }, [modelUrl]);

  const handleActivateAr = async () => {
    const arViewer = arViewerRef.current;
    if (!arViewer) {
      toast.error(t("arNotReady"));
      return;
    }

    if (!arViewer.canActivateAR) {
      toast.error(t("arUnsupported"));
      return;
    }

    setIsArLaunching(true);

    try {
      await arViewer.activateAR();
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
        <div
          ref={containerRef}
          className="h-full w-full"
          aria-label={productTitle}
        />

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

        {/* Floating controls */}
        <div className="pointer-events-none absolute inset-x-0 top-3 flex items-center justify-between px-3">
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)] shadow-sm backdrop-blur">
            <Box size={12} />
            {t("gallery3dBadge")}
          </span>

          <button
            type="button"
            onClick={() => runtimeRef.current?.focusModel()}
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
            disabled={!isArReady || isArLaunching}
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

        {isArEligibleDevice ? (
          <model-viewer
            ref={arViewerRef}
            src={modelUrl}
            alt={productTitle}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-placement={arPlacement}
            interaction-prompt="none"
            loading="eager"
            reveal="auto"
            aria-hidden="true"
            tabIndex={-1}
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              opacity: 0,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          />
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
              disabled={!isArReady || isArLaunching}
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
            onClick={() => runtimeRef.current?.focusModel()}
            disabled={viewerState !== "ready"}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={12} />
            {t("model3dResetView")}
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[radial-gradient(circle_at_top,#fff7ee_0%,#f4ebdf_55%,#eadfce_100%)]">
        <div ref={containerRef} className="h-[480px] w-full" aria-label={productTitle} />

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

      {isArEligibleDevice ? (
        <model-viewer
          ref={arViewerRef}
          src={modelUrl}
          alt={productTitle}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement={arPlacement}
          interaction-prompt="none"
          loading="eager"
          reveal="auto"
          aria-hidden="true"
          tabIndex={-1}
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            opacity: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        />
      ) : null}
    </div>
  );
}
