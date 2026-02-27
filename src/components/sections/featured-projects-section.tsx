import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { CategoryBadge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types";

export function FeaturedProjectsSection({ projects }: { projects: Project[] }) {
  return (
    <section className="py-14 md:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Вибрані роботи"
            title="Кілька прикладів, щоб відчути рівень виконання"
            description="Добірка актуальних проєктів майстерні. Більше кейсів у повному каталозі."
          />
          <Link href="/catalog">
            <Button variant="secondary">Дивитись усі роботи</Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/catalog/${project.slug}`} className="group overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={project.cover_image}
                  alt={project.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <CategoryBadge category={project.category} />
                  <StatusBadge status={project.status} />
                </div>
                <h3 className="font-medium text-[var(--color-text-primary)]">{project.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{project.completed_at ? new Date(project.completed_at).getFullYear() : "Поточний"}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

