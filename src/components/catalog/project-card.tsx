import Image from "next/image";
import Link from "next/link";
import { CategoryBadge, StatusBadge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";

type Props = {
  project: Project;
};

export function ProjectCard({ project }: Props) {
  const isNda = project.status === "nda";
  const isNdaFull = project.privacy_level === "nda_full";
  const imageSrc = isNdaFull ? "/window.svg" : project.cover_image;
  const locationLabel = isNda ? "Конфіденційна локація" : project.location ?? "Україна";

  return (
    <Link
      href={`/catalog/${project.slug}`}
      className="group overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white"
    >
      <div className="relative h-60 overflow-hidden">
        <Image
          src={imageSrc}
          alt={project.title}
          fill
          className={`object-cover transition duration-500 group-hover:scale-105 ${
            isNda && !isNdaFull ? "blur-[2px]" : ""
          }`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {isNda ? (
          <div className="absolute inset-0 grid place-items-center bg-black/40 text-sm font-semibold text-white">
            {isNdaFull ? "Конфіденційний проєкт" : "Під NDA"}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge category={project.category} />
          <StatusBadge status={project.status} />
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{project.title}</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">{locationLabel}</p>
      </div>
    </Link>
  );
}