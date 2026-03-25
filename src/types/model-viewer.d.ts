import type * as React from "react";
import type { ModelViewerElement } from "@google/model-viewer";

type ModelViewerAttributes = React.DetailedHTMLProps<
  React.HTMLAttributes<ModelViewerElement>,
  ModelViewerElement
> & {
  alt?: string;
  src?: string;
  poster?: string;
  loading?: "auto" | "eager" | "lazy";
  reveal?: "auto" | "interaction" | "manual";
  ar?: boolean;
  "ar-modes"?: string;
  "ar-placement"?: "floor" | "wall";
  "ar-scale"?: "auto" | "fixed";
  "ios-src"?: string;
  "camera-controls"?: boolean;
  "interaction-prompt"?: "auto" | "none";
  "touch-action"?: string;
  "disable-zoom"?: boolean;
  "disable-pan"?: boolean;
  "disable-tap"?: boolean;
  "xr-environment"?: boolean;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}

export {};
