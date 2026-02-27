import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectCard } from "@/components/catalog/project-card";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  getCatalogProjects,
  getServiceBySlug,
  getServices,
  parseCatalogFilters,
} from "@/lib/data/queries";

export const revalidate = 3600;

type Params = { slug: string };

const serviceCategoryMap: Record<string, "doors" | "furniture" | "windows" | undefined> = {
  "dveri-na-zamovlennia": "doors",
  "mebli-na-zamovlennia": "furniture",
  "vikna-pvh": "windows",
};

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return { title: "Послугу не знайдено" };
  }

  return {
    title: service.title,
    description: service.short_description,
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const category = serviceCategoryMap[slug];

  const relatedProjects = category
    ? (
        await getCatalogProjects(
          parseCatalogFilters({
            category,
            page: "1",
          }),
        )
      ).items.slice(0, 4)
    : [];

  return (
    <>
      <section className="py-14 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="relative h-[360px] overflow-hidden rounded-3xl">
              <Image
                src={service.cover_image}
                alt={service.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="space-y-5">
              <h1 className="font-display text-4xl text-[var(--color-text-primary)]">{service.title}</h1>
              <p className="text-[var(--color-text-secondary)]">{service.description}</p>
              <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-secondary)]">
                Вартість визначається індивідуально після консультації.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/contact" className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white">
                  Замовити
                </Link>
                <Link href="/contact" className="rounded-full border border-[var(--color-border)] px-6 py-3 text-sm text-[var(--color-text-secondary)]">
                  Отримати розрахунок
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--color-surface)] py-14 md:py-20">
        <Container>
          <SectionHeading title="Процес" />
          <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {service.process_steps.map((step, index) => (
              <li key={step} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-secondary)]">Етап {index + 1}</p>
                <p className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">{step}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {relatedProjects.length > 0 ? (
        <section className="py-14 md:py-20">
          <Container>
            <SectionHeading title="Вибрані роботи за цією послугою" />
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {relatedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <FinalCtaSection />
    </>
  );
}

