import { SiteHeader } from "@/components/shared/header";
import { SiteFooter } from "@/components/shared/footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
