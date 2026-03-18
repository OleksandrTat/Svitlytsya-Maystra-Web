"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteProjectAction } from "@/actions/admin";
import { ProjectFormPopup } from "@/components/admin/projects/project-form-popup";
import { ProjectPhotoUploadPanel } from "@/components/admin/projects/project-photo-upload-panel";
import { PROJECT_CATEGORY_LABELS } from "@/lib/constants";
import type { ClientSummary } from "@/lib/data/queries";
import type { Product, Project } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  projects: Project[];
  clients: ClientSummary[];
  availableProducts: Product[];
  projectProductMap?: Record<string, string[]>;
};

const STATUS_CHIP: Record<string, string> = {
  public: "bg-emerald-100 text-emerald-800",
  nda: "bg-amber-100 text-amber-800",
  concept: "bg-zinc-100 text-zinc-500",
};

const STATUS_LABEL: Record<string, string> = {
  public: "Публічний",
  nda: "Непублічний",
  concept: "Концепт",
};

export default function AdminProjectsClient({
  projects: initialProjects,
  clients,
  availableProducts,
  projectProductMap = {},
}: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const filteredProjects = projects.filter((project) => {
    const normalizedQuery = query.toLowerCase();
    if (
      normalizedQuery &&
      !project.title.toLowerCase().includes(normalizedQuery) &&
      !project.slug.includes(normalizedQuery)
    ) {
      return false;
    }

    if (categoryFilter && project.category !== categoryFilter) {
      return false;
    }

    if (statusFilter && project.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const handleDelete = async (project: Project) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast.warning(`Видалити «${project.title}»?`, {
        duration: 6000,
        action: { label: "Видалити", onClick: () => resolve(true) },
        cancel: { label: "Скасувати", onClick: () => resolve(false) },
      });
    });

    if (!confirmed) {
      return;
    }

    setDeletingId(project.id);
    const formData = new FormData();
    formData.set("id", project.id);
    const result = await deleteProjectAction(formData);

    if (result.ok) {
      toast.success(result.message);
      setProjects((current) => current.filter((item) => item.id !== project.id));
    } else {
      toast.error(result.message);
    }

    setDeletingId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2">
            <Search size={14} className="text-[var(--color-text-secondary)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Пошук за назвою або slug..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-text-secondary)]"
            />
          </div>
        </div>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          <option value="">Усі категорії</option>
          {Object.entries(PROJECT_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
        >
          <option value="">Усі статуси</option>
          <option value="public">Публічні</option>
          <option value="nda">Непублічні</option>
          <option value="concept">Концепти</option>
        </select>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)]"
        >
          <Plus size={16} />
          Новий проєкт
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
        {Object.entries(PROJECT_CATEGORY_LABELS).map(([category, label]) => {
          const count = projects.filter((project) => project.category === category).length;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category === categoryFilter ? "" : category)}
              className={cn(
                "rounded-2xl border p-3 text-left transition",
                category === categoryFilter
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-100)]"
                  : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary-300)]",
              )}
            >
              <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{count}</p>
            </button>
          );
        })}

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-3">
          <p className="text-xs text-[var(--color-text-secondary)]">Усього</p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
            {projects.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-3">
          <p className="text-xs text-[var(--color-text-secondary)]">На головній</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {projects.filter((project) => project.is_featured).length}
          </p>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] py-16">
          <FolderOpen size={32} className="text-[var(--color-border)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">
            {query || categoryFilter || statusFilter
              ? "За фільтрами нічого не знайдено"
              : "Ще немає проєктів"}
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={14} />
            Створити перший проєкт
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white transition hover:shadow-md"
            >
              <div className="relative h-44 overflow-hidden bg-[var(--color-surface)]">
                {project.cover_image ? (
                  <Image
                    src={project.cover_image}
                    alt={project.title}
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    sizes="400px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FolderOpen size={32} className="text-[var(--color-border)]" />
                  </div>
                )}

                <div className="absolute left-2 top-2 flex gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      STATUS_CHIP[project.status] ?? "bg-zinc-100",
                    )}
                  >
                    {STATUS_LABEL[project.status] ?? project.status}
                  </span>
                  <span className="rounded-full border border-white/30 bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                    {PROJECT_CATEGORY_LABELS[project.category]}
                  </span>
                </div>

                {project.status === "nda" ? (
                  <div className="absolute right-2 top-2">
                    <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                      <EyeOff size={9} />
                      NDA
                    </span>
                  </div>
                ) : null}

                {project.is_featured ? (
                  <div className="absolute bottom-2 right-2">
                    <Star size={14} className="text-amber-400 drop-shadow" />
                  </div>
                ) : null}

                {project.images.length > 0 ? (
                  <div className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                    {project.images.length} фото
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 p-4">
                <p className="leading-tight font-semibold text-[var(--color-text-primary)]">
                  {project.title}
                </p>

                {project.location ? (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Локація: {project.location}
                  </p>
                ) : null}

                <p className="line-clamp-2 text-xs text-[var(--color-text-secondary)]">
                  {project.description}
                </p>

                <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2.5">
                  <div className="flex items-center gap-1">
                    {project.is_featured ? (
                      <Eye size={12} className="text-emerald-600" />
                    ) : (
                      <Eye size={12} className="text-[var(--color-border)]" />
                    )}
                    <span className="text-[10px] text-[var(--color-text-secondary)]">
                      {project.completed_at ? new Date(project.completed_at).getFullYear() : "-"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditProject(project)}
                      className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(project)}
                      disabled={deletingId === project.id}
                      className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] transition hover:border-red-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ProjectPhotoUploadPanel
        projects={projects.map((project) => ({
          id: project.id,
          title: project.title,
          imagesCount: project.images.length,
        }))}
      />

      {createOpen ? (
        <ProjectFormPopup
          key="create-project"
          open={createOpen}
          onClose={() => {
            setCreateOpen(false);
            router.refresh();
          }}
          clients={clients}
          availableProducts={availableProducts}
        />
      ) : null}

      {editProject ? (
        <ProjectFormPopup
          key={`edit-project-${editProject.id}`}
          open={Boolean(editProject)}
          onClose={() => {
            setEditProject(null);
            router.refresh();
          }}
          clients={clients}
          availableProducts={availableProducts}
          initialLinkedProductIds={projectProductMap[editProject.id] ?? []}
          initialData={editProject}
        />
      ) : null}
    </div>
  );
}
