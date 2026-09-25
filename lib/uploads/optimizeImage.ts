const OPTIMIZABLE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_EDGE_PX = 2560;
const SKIP_BELOW_BYTES = 2 * 1024 * 1024;
const JPEG_QUALITY = 0.86;
const MAX_OPTIMIZABLE_MB = 60;

export function isOptimizableImage(file: File): boolean {
  return (
    OPTIMIZABLE_TYPES.has(file.type.toLowerCase()) &&
    file.size <= MAX_OPTIMIZABLE_MB * 1024 * 1024
  );
}

/** Size to check in the picker before optimisation shrinks the file. */
export function exceedsPickerSizeLimit(file: File, maxSizeMb: number): boolean {
  if (isOptimizableImage(file)) return false;
  return file.size > maxSizeMb * 1024 * 1024;
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fall through to <img> decoding
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Downscales and re-encodes large photos in the browser so camera-sized files
 * fit storage limits. Returns the original file when optimisation isn't
 * possible or wouldn't make it smaller.
 */
export async function optimizeImageForUpload(file: File): Promise<File> {
  if (typeof window === "undefined" || typeof document === "undefined") return file;
  if (!OPTIMIZABLE_TYPES.has(file.type.toLowerCase())) return file;

  try {
    const source = await decodeImage(file);
    const width = "naturalWidth" in source ? source.naturalWidth : source.width;
    const height = "naturalHeight" in source ? source.naturalHeight : source.height;
    if (!width || !height) return file;

    const longEdge = Math.max(width, height);
    if (file.size <= SKIP_BELOW_BYTES && longEdge <= MAX_EDGE_PX) return file;

    const scale = Math.min(1, MAX_EDGE_PX / longEdge);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    if ("close" in source) source.close();

    const keepsAlpha = file.type === "image/png" || file.type === "image/webp";
    const outputType = keepsAlpha ? "image/webp" : "image/jpeg";
    const blob = await canvasToBlob(canvas, outputType, JPEG_QUALITY);
    if (!blob || blob.type !== outputType || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    const extension = outputType === "image/webp" ? "webp" : "jpg";
    return new File([blob], `${baseName}.${extension}`, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("Image optimisation skipped", error);
    return file;
  }
}
