import type { CSSProperties, ReactNode } from "react";

export default function CulturalLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={
        {
          "--color-primary": "#2d4a3e",
          "--color-primary-700": "#1f3429",
          "--color-primary-500": "#3d6b55",
          "--color-primary-300": "#c8ddd5",
          "--color-primary-100": "#eef6f2",
          "--color-on-primary": "#f0f8f4",
          "--color-secondary": "#8b6914",
          "--color-surface": "#f3f8f5",
          "--color-bg-warm": "#f0f6f3",
          "--color-border": "#d4e4de",
        } as CSSProperties
      }
    >
      <div
        className="px-4 py-2.5 text-center text-xs font-medium tracking-wide"
        style={{ background: "#2d4a3e", color: "#c8ddd5" }}
      >
        ✦ Культурний блог — окремий розділ про ремесло, традиції та матеріали ✦
      </div>
      {children}
    </div>
  );
}
