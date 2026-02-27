import { SiteHeader } from "@/components/shared/header";
import { SiteFooter } from "@/components/shared/footer";
import { CookieBanner } from "@/components/shared/cookie-banner";
import { PosthogPageView } from "@/components/shared/posthog-pageview";
import { Suspense } from "react";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Suspense fallback={null}>
        <PosthogPageView />
      </Suspense>
      <main>{children}</main>
      <SiteFooter />
      <CookieBanner />
    </div>
  );
}

