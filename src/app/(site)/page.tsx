import type { Metadata } from "next";
import { HomeHeroSection } from "@/components/sections/home-hero-section";
import { HomeAboutSection } from "@/components/sections/home-about-section";
import { HomeBenefitsSection } from "@/components/sections/home-benefits-section";
import { FeaturedProjectsSection } from "@/components/sections/featured-projects-section";
import { HomeQualitySection } from "@/components/sections/home-quality-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { getFeaturedProjects, getVisibleTestimonials } from "@/lib/data/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Двері, меблі та вікна під ключ",
  description:
    "Svitlytsya Maystra — сімейна майстерня з 26+ роками досвіду. Індивідуальні проєкти дверей, меблів, вікон і реставрація.",
};

export default async function HomePage() {
  const [featuredProjects, testimonials] = await Promise.all([
    getFeaturedProjects(6),
    getVisibleTestimonials(3),
  ]);

  return (
    <>
      <HomeHeroSection />
      <HomeAboutSection />
      <HomeBenefitsSection />
      <FeaturedProjectsSection projects={featuredProjects} />
      <HomeQualitySection />
      <TestimonialsSection testimonials={testimonials} />
      <FinalCtaSection />
    </>
  );
}

