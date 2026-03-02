import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

type UploadPublicImageParams = {
  file: File;
  folder: string;
  bucket?: string;
  upsert?: boolean;
};

type UploadPublicImageResult = {
  publicUrl: string;
  path: string;
};

function getFileSafeName(value: string) {
  return value.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
}

function validateImageFile(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Unsupported image format. Use PNG, JPG or WEBP.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image is too large. Maximum size is 10 MB.");
  }
}

export async function uploadPublicImage({
  file,
  folder,
  bucket = "blog-images",
  upsert = true,
}: UploadPublicImageParams): Promise<UploadPublicImageResult> {
  validateImageFile(file);

  const supabase = createSupabaseBrowserClient();
  const safeFolder = folder.replace(/(^\/+|\/+$)/g, "");
  const path = `${safeFolder}/${Date.now()}-${getFileSafeName(file.name) || "image"}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert });
  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}
