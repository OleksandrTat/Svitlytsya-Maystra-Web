import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectCard } from "@/components/catalog/project-card";
import { ProjectGallery } from "@/components/catalog/project-gallery";
import { ProjectInfo } from "@/components/catalog/project-info";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  getAllPublicProjectSlugs,
  getProjectBySlug,
  getRelatedProjects,
} from "@/lib/data/queries";
import { env } from "@/lib/env";

export const revalidate = 60;

type PageParams = {
  slug: string;
};

export async function generateStaticParams() {
  const slugs = await getAllPublicProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Проєкт не знайдено",
    };
  }

  return {
    title: `${project.title}`,
    description: project.description.slice(0, 160),
    openGraph: {
      title: project.title,
      description: project.description,
      images: [{ url: project.cover_image }],
      type: "article",
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project || project.status === "nda") {
    notFound();
  }

  const related = await getRelatedProjects(project, 4);

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    image: project.images,
    dateCreated: project.created_at,
    datePublished: project.completed_at,
    creator: {
      "@type": "Organization",
      name: "Svitlytsya Maystra",
      url: env.siteUrl ?? "https://svitlytsya.ua",
    },
  };

  return (
    <>
      <section className="py-14 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <ProjectGallery images={project.images.length ? project.images : [project.cover_image]} title={project.title} />
            <ProjectInfo project={project} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/contact?projectRef=${project.id}`}
              className="rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white"
            >
              Запросити подібний проєкт
            </Link>
            <Link
              href="/catalog"
              className="rounded-full border border-[var(--color-border)] px-6 py-3 text-sm text-[var(--color-text-secondary)]"
            >
              Повернутись до каталогу
            </Link>
          </div>
        </Container>
      </section>

      {related.length > 0 ? (
        <section className="pb-14 md:pb-20">
          <Container>
            <SectionHeading title="Схожі проєкти" />
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {related.map((item) => (
                <ProjectCard key={item.id} project={item} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <FinalCtaSection projectRefId={project.id} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </>
  );
}

