"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";
import { Box, RotateCcw, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  ACESFilmicToneMapping,
  Box3,
  Clock,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

type Props = {
  modelUrl: string;
  productTitle: string;
  arPlacement?: "floor" | "wall";
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

function prepareModel(root: Object3D) {
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
      material.side = DoubleSide;
      material.needsUpdate = true;

      if (material instanceof MeshStandardMaterial) {
        material.roughness = Math.max(material.roughness, 0.38);
        material.metalness = Math.min(material.metalness, 0.32);
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
}: Props) {
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
        prepareModel(currentModel);
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
      container.innerHTML = "";
    };
  }, [modelUrl]);

  if (viewerState === "error") {
    return (
      <div className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="text-center">
          <Box size={32} className="mx-auto text-[var(--color-border)]" />
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            3D-модель не вдалося показати
          </p>
        </div>
      </div>
    );
  }

  const handleActivateAr = async () => {
    const arViewer = arViewerRef.current;
    if (!arViewer) {
      toast.error("AR ще готується.");
      return;
    }

    if (!arViewer.canActivateAR) {
      toast.error("AR недоступний у цьому браузері. Спробуйте Safari на iPhone/iPad або Chrome на Android.");
      return;
    }

    setIsArLaunching(true);

    try {
      await arViewer.activateAR();
    } catch (error) {
      console.error("Failed to activate AR", error);
      toast.error("Не вдалося відкрити AR.");
    } finally {
      setIsArLaunching(false);
    }
  };

  return (
    <div className="relative space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Box size={16} className="text-[var(--color-primary)]" />
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">3D-перегляд</p>
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
              {isArLaunching ? "Відкриваємо AR..." : isArReady ? "Відкрити AR" : "Підготовка AR..."}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => runtimeRef.current?.focusModel()}
            disabled={viewerState !== "ready"}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={12} />
            Скинути ракурс
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
                Завантаження 3D-моделі{progress > 0 ? ` (${progress}%)` : "..."}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <p className="text-center text-xs text-[var(--color-text-secondary)]">
        Потягніть, щоб обертати модель, і прокрутіть, щоб змінити масштаб.
      </p>

      {isArEligibleDevice ? (
        <p className="text-center text-[11px] text-[var(--color-text-secondary)]">
          AR працює на iPhone/iPad у Safari та на Android у Chrome.
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
