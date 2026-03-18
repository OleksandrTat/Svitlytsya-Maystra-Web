"use server";

import { randomUUID } from "crypto";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type UploadResult = {
  ok: boolean;
  message: string;
  url?: string;
  blurDataUrl?: string;
};

const PROJECT_PHOTOS_BUCKET = "project-images";

export async function uploadProjectPhotoAction(formData: FormData): Promise<UploadResult> {
  await requireAdmin();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client is not configured." };
  }

  const file = formData.get("file");
  const projectId = String(formData.get("projectId") || "").trim();

  if (!(file instanceof File)) {
    return { ok: false, message: "Photo file is required." };
  }

  if (!projectId) {
    return { ok: false, message: "Project id is required." };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "Only image files are supported." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const optimized = await sharp(buffer)
    .rotate()
    .resize(1400, 1000, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  const blurBuffer = await sharp(buffer)
    .rotate()
    .resize(24, 18, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();

  const filename = `${projectId}/${Date.now()}-${randomUUID()}.webp`;
  const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString("base64")}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(PROJECT_PHOTOS_BUCKET)
    .upload(filename, optimized, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError || !uploadData) {
    return {
      ok: false,
      message: uploadError?.message || "Failed to upload image to storage.",
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROJECT_PHOTOS_BUCKET).getPublicUrl(uploadData.path);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, slug, images")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return { ok: false, message: "Project not found after upload." };
  }

  const existingImages = Array.isArray(project.images) ? project.images : [];
  const nextImages = existingImages.includes(publicUrl)
    ? existingImages
    : [...existingImages, publicUrl];

  const { error: updateError } = await supabase
    .from("projects")
    .update({ images: nextImages })
    .eq("id", projectId);

  if (updateError) {
    return { ok: false, message: "Image uploaded but project update failed." };
  }

  revalidatePath("/admin/projects");
  revalidatePath("/catalog");
  if (project.slug) {
    revalidatePath(`/catalog/${project.slug}`);
  }

  return {
    ok: true,
    message: "Photo uploaded.",
    url: publicUrl,
    blurDataUrl,
  };
}
