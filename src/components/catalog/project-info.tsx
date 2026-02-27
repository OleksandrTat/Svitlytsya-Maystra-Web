import { formatProjectDate } from "@/lib/utils";
import { CategoryBadge, StatusBadge } from "@/components/ui/badge";
import type { Project } from "@/lib/types";

export function ProjectInfo({ project }: { project: Project }) {
  return (
    <section className="space-y-6 rounded-3xl border border-[var(--color-border)] bg-white p-6">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={project.category} />
        <StatusBadge status={project.status} />
      </div>

      <div>
        <h1 className="font-display text-3xl text-[var(--color-text-primary)] md:text-4xl">{project.title}</h1>
        <p className="mt-3 text-[var(--color-text-secondary)]">{project.description}</p>
      </div>

      <dl className="grid gap-4 text-sm text-[var(--color-text-secondary)] sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-[var(--color-text-primary)]">Матеріали</dt>
          <dd>{project.materials.join(", ") || "-"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--color-text-primary)]">Стилі</dt>
          <dd>{project.style.join(", ") || "-"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--color-text-primary)]">Розміри</dt>
          <dd>{project.dimensions || "-"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--color-text-primary)]">Локація</dt>
          <dd>{project.location || "-"}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--color-text-primary)]">Дата завершення</dt>
          <dd>{formatProjectDate(project.completed_at)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--color-text-primary)]">Термін виконання</dt>
          <dd>{project.duration_days ? `${project.duration_days} днів` : "-"}</dd>
        </div>
      </dl>
    </section>
  );
}

