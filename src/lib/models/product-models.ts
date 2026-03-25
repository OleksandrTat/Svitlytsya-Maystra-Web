export const PRODUCT_MODEL_BUCKET = "product-models";
export const PRODUCT_MODEL_MAX_SIZE_BYTES = 50 * 1024 * 1024;
export const PRODUCT_MODEL_CONTENT_TYPE = "model/gltf-binary";

const GLB_FILE_NAME_PATTERN = /\.glb$/i;
const GLB_URL_PATTERN = /\.glb(?:[?#].*)?$/i;

export function isSupportedProductModelFileName(fileName: string) {
  return GLB_FILE_NAME_PATTERN.test(fileName.trim());
}

export function isSupportedProductModelUrl(url: string) {
  return GLB_URL_PATTERN.test(url.trim());
}

export function sanitizeProductModelFileName(fileName: string) {
  const trimmed = fileName.trim().replace(/\s+/g, "-");
  const sanitized = trimmed.replace(/[^A-Za-z0-9._-]/g, "");

  if (!sanitized) {
    return `model-${Date.now()}.glb`;
  }

  return isSupportedProductModelFileName(sanitized) ? sanitized : `${sanitized}.glb`;
}

export function buildProductModelPath(fileName: string) {
  return `models/${Date.now()}-${sanitizeProductModelFileName(fileName)}`;
}
