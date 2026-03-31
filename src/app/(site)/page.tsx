import type { Metadata } from "next";
import { getContactSettings, getPublishedCertificates, getVisibleTestimonials } from "@/lib/data/queries";
import { HeroSection } from "@/components/home/hero-section";
import { ServicesGrid } from "@/components/home/services-grid";
import { PortfolioSection } from "@/components/home/portfolio-section";
import { WhyUsSection } from "@/components/home/why-us-section";
import { ProcessTimeline } from "@/components/home/process-timeline";
import { AboutWorkshop } from "@/components/home/about-workshop";
import { CertificatesSection } from "@/components/home/certificates-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { ContactCtaSection } from "@/components/home/contact-cta-section";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Ручна робота, якій довіряють роками",
  description:
    "Svitlytsya Maystra — сімейна майстерня дверей, меблів і вікон. 26+ років досвіду, 20 000+ реалізованих проєктів, 3 роки гарантії.",
};

export default async function HomePage() {
  const [testimonials, contacts, certificates] = await Promise.all([
    getVisibleTestimonials(3),
    getContactSettings(),
    getPublishedCertificates(),
  ]);

  return (
    <>
      <HeroSection />
      <ServicesGrid />
      <PortfolioSection />
      <WhyUsSection />
      <ProcessTimeline />
      <AboutWorkshop />
      <CertificatesSection certificates={certificates} />
      <TestimonialsSection testimonials={testimonials} />
      <ContactCtaSection contacts={contacts} />
    </>
  );
}
