const JPEG_EXTENSIONS = new Set([".jpg", ".jpeg", ".jpe", ".jfif"]);
const JPEG_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/jfif",
]);
const IMAGE_EXTENSIONS = new Set([
  ...JPEG_EXTENSIONS,
  ".png",
  ".webp",
  ".gif",
]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
]);

type AcceptValue = string | Record<string, string[]>;

type ParsedAccept = {
  mimeTypes: string[];
  extensions: string[];
};

function normalizeExtension(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
}

export function parseAccept(accept: AcceptValue): ParsedAccept {
  if (typeof accept === "string") {
    const parts = accept
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);
    return {
      mimeTypes: parts.filter((part) => !part.startsWith(".")),
      extensions: parts
        .filter((part) => part.startsWith("."))
        .map(normalizeExtension),
    };
  }

  return {
    mimeTypes: Object.keys(accept).map((mime) => mime.toLowerCase()),
    extensions: Object.values(accept)
      .flat()
      .map(normalizeExtension)
      .filter(Boolean),
  };
}

export function acceptAttribute(accept: AcceptValue): string {
  const { mimeTypes, extensions } = parseAccept(accept);
  return [...mimeTypes, ...extensions].join(",");
}

export function fileExtension(file: File): string {
  const name = file.name || "";
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return normalizeExtension(name.slice(dot));
}

export function isLikelyImageFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  const ext = fileExtension(file);
  if (mime.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.has(ext);
}

export function isLikelyVideoFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  const ext = fileExtension(file);
  if (mime.startsWith("video/") || VIDEO_MIME_TYPES.has(mime)) return true;
  return VIDEO_EXTENSIONS.has(ext);
}

export function isAcceptedFile(file: File, accept: AcceptValue): boolean {
  const { mimeTypes, extensions } = parseAccept(accept);
  const mime = (file.type || "").toLowerCase();
  const ext = fileExtension(file);
  const allowsAnyImage = mimeTypes.includes("image/*");
  const allowsAnyVideo = mimeTypes.includes("video/*");
  const allowsJpeg =
    mimeTypes.some((type) => JPEG_MIME_TYPES.has(type)) ||
    extensions.some((item) => JPEG_EXTENSIONS.has(item)) ||
    allowsAnyImage;
  const allowsVideo =
    mimeTypes.some((type) => type.startsWith("video/") || VIDEO_MIME_TYPES.has(type)) ||
    extensions.some((item) => VIDEO_EXTENSIONS.has(item)) ||
    allowsAnyVideo;

  if (allowsJpeg && (JPEG_MIME_TYPES.has(mime) || JPEG_EXTENSIONS.has(ext))) {
    return true;
  }

  if (allowsVideo && (VIDEO_MIME_TYPES.has(mime) || VIDEO_EXTENSIONS.has(ext) || mime.startsWith("video/"))) {
    return true;
  }

  if (mime && mimeTypes.includes(mime)) return true;
  if (allowsAnyImage && mime.startsWith("image/")) return true;
  if (ext && extensions.includes(ext)) return true;

  return false;
}

export const STUDIO_IMAGE_ACCEPT: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg", ".jpe", ".jfif"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);

export function isHeicLikeFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase();
  const ext = fileExtension(file);
  return mime.includes("heic") || mime.includes("heif") || HEIC_EXTENSIONS.has(ext);
}

/** JPEG / PNG / WebP only — HEIC and other camera formats are rejected. */
export function isSupportedStudioImageFile(file: File): boolean {
  if (isHeicLikeFile(file)) return false;
  return isAcceptedFile(file, STUDIO_IMAGE_ACCEPT);
}

export function safeStorageExtension(file: File, fallback = "jpg"): string {
  const ext = fileExtension(file).replace(/^\./, "").toLowerCase();
  if (/^[a-z0-9]{1,5}$/.test(ext) && !["heic", "heif"].includes(ext)) {
    return ext;
  }

  switch (inferredContentType(file)) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    case "video/quicktime":
      return "mov";
    default:
      return fallback;
  }
}

export function inferredContentType(file: File): string {
  const mime = (file.type || "").toLowerCase();
  const ext = fileExtension(file);

  if (JPEG_MIME_TYPES.has(mime) || JPEG_EXTENSIONS.has(ext)) {
    return "image/jpeg";
  }

  if (file.type) return file.type;

  switch (ext) {
    case ".jpg":
    case ".jpeg":
    case ".jpe":
    case ".jfif":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    default:
      return "application/octet-stream";
  }
}

export function storagePathForUpload(path: string | undefined, fileName: string): string {
  const folder = (path || "").replace(/^\/+|\/+$/g, "");
  return folder ? `${folder}/${fileName}` : fileName;
}
