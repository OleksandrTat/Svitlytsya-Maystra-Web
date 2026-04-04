import { SiteHeader } from "@/components/shared/header";
import { SiteFooter } from "@/components/shared/footer";
import { Chatbot } from "@/components/shared/chatbot";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pt-[72px]">{children}</main>
      <SiteFooter />
      <Chatbot />
    </div>
  );
}
