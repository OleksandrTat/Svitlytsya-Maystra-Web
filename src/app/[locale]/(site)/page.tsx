import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { getPublishedCertificates, getVisibleTestimonials } from "@/lib/data/queries";
import { HeroSection } from "@/components/home/hero-section";
import { ServicesGrid } from "@/components/home/services-grid";
import { PortfolioSection } from "@/components/home/portfolio-section";
import { WhyUsSection } from "@/components/home/why-us-section";
import { ProcessTimeline } from "@/components/home/process-timeline";
import { AboutWorkshop } from "@/components/home/about-workshop";
import { CertificatesSection } from "@/components/home/certificates-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { localizeCertificate } from "@/lib/i18n/content";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
  };
}

export default async function HomePage() {
  const [testimonials, certificates, locale] = await Promise.all([
    getVisibleTestimonials(3),
    getPublishedCertificates(),
    getLocale(),
  ]);

  const localizedCertificates = certificates.map((c) =>
    localizeCertificate(c, locale as "uk" | "en"),
  );

  return (
    <>
      <HeroSection />
      <ServicesGrid />
      <PortfolioSection />
      <WhyUsSection />
      <ProcessTimeline />
      <AboutWorkshop />
      <CertificatesSection certificates={localizedCertificates} />
      <TestimonialsSection testimonials={testimonials} />
      <FinalCtaSection />
    </>
  );
}
