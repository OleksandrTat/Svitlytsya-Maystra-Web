"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PhotoDropzone } from "@/components/admin/shared/photo-dropzone";

type ProjectOption = {
  id: string;
  title: string;
  imagesCount: number;
};

export function ProjectPhotoUploadPanel({ projects }: { projects: ProjectOption[] }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id ?? "");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[280px] flex-1">
          <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">Проєкт</label>
          <select
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        {selectedProject ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            Поточних фото: <strong>{selectedProject.imagesCount}</strong>
          </p>
        ) : null}
      </div>

      <PhotoDropzone
        projectId={selectedProjectId}
        onUploaded={(urls) => {
          toast.success(`Додано ${urls.length} фото до каталогу.`);
        }}
      />
    </section>
  );
}
