"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, UploadCloud, XCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { uploadProjectPhotoAction } from "@/actions/admin/uploads";

type UploadStatus = "pending" | "uploading" | "done" | "error";

type UploadFile = {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  progress: number;
  uploadedUrl?: string;
};

type PhotoDropzoneProps = {
  projectId: string;
  onUploaded?: (urls: string[]) => void;
};

async function uploadSingle(
  projectId: string,
  item: UploadFile,
  updateProgress: (next: number) => void,
) {
  const fd = new FormData();
  fd.set("projectId", projectId);
  fd.set("file", item.file);

  // Simulated upload progress for better UX while server action resolves.
  let progress = 0;
  const timer = setInterval(() => {
    progress = Math.min(90, progress + 8);
    updateProgress(progress);
  }, 120);

  try {
    const result = await uploadProjectPhotoAction(fd);
    clearInterval(timer);
    if (!result.ok || !result.url) {
      throw new Error(result.message);
    }
    updateProgress(100);
    return result.url;
  } catch (error) {
    clearInterval(timer);
    throw error;
  }
}

export function PhotoDropzone({ projectId, onUploaded }: PhotoDropzoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const doUpload = useCallback(
    async (incoming: UploadFile[]) => {
      const urls: string[] = [];
      const queue = [...incoming];
      const concurrency = 3;
      const workers: Promise<void>[] = [];

      const runWorker = async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (!item) {
            break;
          }

          setFiles((prev) =>
            prev.map((entry) =>
              entry.id === item.id ? { ...entry, status: "uploading", progress: 5 } : entry,
            ),
          );

          try {
            const url = await uploadSingle(projectId, item, (next) => {
              setFiles((prev) =>
                prev.map((entry) =>
                  entry.id === item.id ? { ...entry, status: "uploading", progress: next } : entry,
                ),
              );
            });

            urls.push(url);
            setFiles((prev) =>
              prev.map((entry) =>
                entry.id === item.id
                  ? { ...entry, status: "done", progress: 100, uploadedUrl: url }
                  : entry,
              ),
            );
          } catch {
            setFiles((prev) =>
              prev.map((entry) =>
                entry.id === item.id ? { ...entry, status: "error", progress: 0 } : entry,
              ),
            );
          }
        }
      };

      for (let index = 0; index < Math.min(concurrency, queue.length || concurrency); index += 1) {
        workers.push(runWorker());
      }
      await Promise.all(workers);

      if (urls.length > 0) {
        toast.success(`Завантажено ${urls.length} фото.`);
        onUploaded?.(urls);
      } else {
        toast.error("Жодне фото не вдалося завантажити.");
      }
    },
    [onUploaded, projectId],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (!projectId) {
        toast.error("Спочатку оберіть проєкт.");
        return;
      }

      const prepared = acceptedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: "pending" as const,
        progress: 0,
      }));

      setFiles((prev) => [...prepared, ...prev].slice(0, 20));
      void doUpload(prepared);
    },
    [doUpload, projectId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 20,
    maxSize: 10 * 1024 * 1024,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
    },
  });

  const hasFiles = useMemo(() => files.length > 0, [files.length]);

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${
          isDragActive
            ? "scale-[1.01] border-[var(--color-primary)] bg-[var(--color-primary-100)]"
            : "border-[var(--color-border)] hover:border-[var(--color-primary-500)] hover:bg-[var(--color-bg-section)]"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <UploadCloud size={36} className="text-[var(--color-gray-500)]" />
          <p className="font-medium text-[var(--color-text-primary)]">
            {isDragActive ? "Відпустіть фото..." : "Перетягніть фото або натисніть"}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            JPG/PNG/WebP, до 10MB, до 20 файлів
          </p>
        </div>
      </div>

      {hasFiles ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <AnimatePresence>
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative aspect-square overflow-hidden rounded-lg border border-[var(--color-border)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={file.preview} alt={file.file.name} className="h-full w-full object-cover" />
                {file.status === "uploading" ? (
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2">
                    <div className="h-1.5 w-full rounded-full bg-white/30">
                      <div
                        className="h-1.5 rounded-full bg-white transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                ) : null}
                {file.status === "done" ? (
                  <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                    <Check size={14} />
                  </span>
                ) : null}
                {file.status === "error" ? (
                  <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white">
                    <XCircle size={14} />
                  </span>
                ) : null}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}
