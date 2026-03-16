import type { CSSProperties, ReactNode } from "react";
import { SiteHeader } from "@/components/shared/header";
import { SiteFooter } from "@/components/shared/footer";

export default function CulturalLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        "--color-primary": "#2d4a3e",
        "--color-primary-700": "#1f3429",
        "--color-primary-500": "#3d6b55",
        "--color-primary-300": "#c8ddd5",
        "--color-primary-100": "#eef6f2",
        "--color-on-primary": "#f0f8f4",
        "--color-secondary": "#8b6914",
        "--color-surface": "#f3f8f5",
        "--color-bg-warm": "#f0f6f3",
      } as CSSProperties}
    >
      <div
        className="py-2 text-center text-xs font-medium"
        style={{ background: "#2d4a3e", color: "#c8ddd5" }}
      >
        ✦ Культурний блог — окремий розділ про ремесло, традиції та матеріали ✦
      </div>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
