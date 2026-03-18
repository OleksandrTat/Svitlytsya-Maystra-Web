"use client";

import Image from "next/image";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ImagePlus, Star, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  bucket?: string;
  folder?: string;
  images: string[];
  coverImage: string;
  onImagesChange: (images: string[], coverImage: string) => void;
  trigger?: React.ReactNode;
};

async function uploadToStorage(file: File, bucket: string, folder: string) {
  const supabase = createSupabaseBrowserClient();
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function PreviewGrid({
  images,
  coverImage,
  onClick,
}: {
  images: string[];
  coverImage: string;
  onClick: () => void;
}) {
  if (images.length === 0) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex h-32 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        <ImagePlus size={18} />
        Додати фото
      </button>
    );
  }

  const visibleImages = images.slice(0, 4);
  const hiddenCount = images.length - 4;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block w-full overflow-hidden rounded-xl border border-[var(--color-border)]"
    >
      <div
        className={cn(
          "grid gap-0.5",
          visibleImages.length === 1
            ? "grid-cols-1"
            : visibleImages.length === 2
              ? "grid-cols-2"
              : "grid-cols-2",
        )}
      >
        {visibleImages.map((source, index) => (
          <div
            key={source}
            className={cn(
              "relative overflow-hidden",
              visibleImages.length === 3 && index === 0 && "row-span-2",
            )}
          >
            <div className="aspect-square w-full">
              <Image src={source} alt="" fill className="object-cover" sizes="200px" />
              {source === coverImage ? (
                <span className="absolute left-1 top-1 rounded-full bg-[var(--color-primary)] p-0.5 text-white">
                  <Star size={10} />
                </span>
              ) : null}
              {index === 3 && hiddenCount > 0 ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
                  +{hiddenCount}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition group-hover:bg-black/30">
        <span className="scale-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] transition group-hover:scale-100">
          Керувати фото
        </span>
      </div>
    </button>
  );
}

export function PhotoUploadPopup({
  bucket = "product-images",
  folder = "products",
  images,
  coverImage,
  onImagesChange,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [localImages, setLocalImages] = useState<string[]>(images);
  const [localCoverImage, setLocalCoverImage] = useState(coverImage);
  const [uploading, setUploading] = useState(false);

  const openPopup = () => {
    setLocalImages(images);
    setLocalCoverImage(coverImage);
    setOpen(true);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true);

    const uploadedUrls: string[] = [];
    for (const file of acceptedFiles) {
      try {
        const url = await uploadToStorage(file, bucket, folder);
        uploadedUrls.push(url);
      } catch {
        toast.error(`Не вдалося завантажити ${file.name}`);
      }
    }

    const nextImages = [...localImages, ...uploadedUrls];
    setLocalImages(nextImages);
    if (!localCoverImage && nextImages.length > 0) {
      setLocalCoverImage(nextImages[0]!);
    }

    setUploading(false);

    if (uploadedUrls.length > 0) {
      toast.success(`Завантажено ${uploadedUrls.length} фото`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  const removeImage = (url: string) => {
    const nextImages = localImages.filter((item) => item !== url);
    setLocalImages(nextImages);
    if (localCoverImage === url) {
      setLocalCoverImage(nextImages[0] ?? "");
    }
  };

  const discard = () => {
    setLocalImages(images);
    setLocalCoverImage(coverImage);
    setOpen(false);
  };

  const save = () => {
    onImagesChange(localImages, localCoverImage);
    setOpen(false);
  };

  return (
    <>
      {trigger ? (
        <div onClick={openPopup}>{trigger}</div>
      ) : (
        <PreviewGrid
          images={images}
          coverImage={coverImage}
          onClick={openPopup}
        />
      )}

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={discard} />

            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  Управління фотографіями
                </h2>
                <button
                  type="button"
                  onClick={discard}
                  className="rounded-full p-1 hover:bg-[var(--color-surface)]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[60vh] space-y-5 overflow-y-auto p-5">
                <div
                  {...getRootProps()}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed py-8 text-sm transition",
                    isDragActive
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-100)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-500)]",
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload size={22} className={isDragActive ? "text-[var(--color-primary)]" : ""} />
                  <p>
                    {isDragActive
                      ? "Відпустіть фото тут..."
                      : "Перетягніть або натисніть для завантаження"}
                  </p>
                  <p className="text-xs opacity-70">JPG / PNG / WEBP до 10MB</p>
                  {uploading ? (
                    <p className="font-semibold text-[var(--color-primary)]">
                      Завантаження...
                    </p>
                  ) : null}
                </div>

                {localImages.length > 0 ? (
                  <div>
                    <p className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">
                      {localImages.length} фото. Натисніть на зірку, щоб зробити обкладинку.
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {localImages.map((url, index) => {
                        const isCover = url === localCoverImage;
                        return (
                          <div
                            key={url}
                            className="group relative aspect-square overflow-hidden rounded-xl border-2 border-transparent"
                          >
                            <Image
                              src={url}
                              alt={`Photo ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="150px"
                            />

                            {isCover ? (
                              <div className="absolute inset-0 rounded-xl ring-2 ring-[var(--color-primary)] ring-inset" />
                            ) : null}

                            <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                              <button
                                type="button"
                                title="Обкладинка"
                                onClick={() => setLocalCoverImage(url)}
                                className={cn(
                                  "rounded-full p-1 transition",
                                  isCover
                                    ? "bg-[var(--color-primary)] text-white"
                                    : "bg-white/80 text-amber-500 hover:bg-white",
                                )}
                              >
                                <Star size={12} />
                              </button>

                              <button
                                type="button"
                                onClick={() => removeImage(url)}
                                className="rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>

                            {isCover ? (
                              <span className="absolute left-1.5 top-1.5 rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                                COVER
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
                <button
                  type="button"
                  onClick={discard}
                  className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm"
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
                >
                  <Check size={14} />
                  Зберегти ({localImages.length} фото)
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
