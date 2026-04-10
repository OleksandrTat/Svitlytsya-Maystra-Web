"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  aspectRatio?: string; // e.g. "16/9", "1/1", "4/3"
};

async function uploadToStorage(file: File, bucket: string, folder: string) {
  const supabase = createSupabaseBrowserClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function CoverImageUpload({
  value,
  onChange,
  bucket = "product-images",
  folder = "covers",
  aspectRatio = "16/9",
}: Props) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToStorage(file, bucket, folder);
      onChange(url);
      toast.success("Фото завантажено");
    } catch {
      toast.error("Не вдалося завантажити фото");
    } finally {
      setUploading(false);
    }
  }, [bucket, folder, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  if (value) {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-zinc-200" style={{ aspectRatio }}>
        <Image src={value} alt="" fill className="object-cover" sizes="600px" />
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition-all group-hover:bg-black/40">
          <label
            {...getRootProps()}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-zinc-700 opacity-0 shadow-lg transition group-hover:opacity-100"
          >
            <input {...getInputProps()} />
            <ImagePlus size={12} /> Замінити
          </label>
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/95 text-red-500 opacity-0 shadow-lg transition group-hover:opacity-100"
          >
            <Trash2 size={13} />
          </button>
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 size={20} className="animate-spin text-[var(--color-primary)]" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-sm transition",
        isDragActive
          ? "border-[var(--color-primary)] bg-[var(--color-primary-100)] text-[var(--color-primary)]"
          : "border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:bg-zinc-50",
      )}
    >
      <input {...getInputProps()} />
      {uploading
        ? <Loader2 size={20} className="animate-spin text-[var(--color-primary)]" />
        : <Upload size={20} />}
      <p>{uploading ? "Завантаження…" : isDragActive ? "Відпустіть тут…" : "Перетягніть або натисніть"}</p>
      <p className="text-xs opacity-60">JPG / PNG / WEBP до 10MB</p>
    </div>
  );
}
