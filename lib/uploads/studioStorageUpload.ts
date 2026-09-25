import { supabase } from "@/lib/supabase";
import {
  fileExtension,
  inferredContentType,
  isHeicLikeFile,
  isSupportedStudioImageFile,
  safeStorageExtension,
  storagePathForUpload,
} from "@/lib/uploads/acceptedMedia";
import { optimizeImageForUpload } from "@/lib/uploads/optimizeImage";

export const DEFAULT_UPLOAD_BUCKET = "brand-assets";

type StorageErrorLike = {
  message?: string;
  statusCode?: string | number;
  error?: string;
};

export async function ensureValidSession(retries = 2): Promise<{
  userId: string;
  email?: string;
}> {
  if (!supabase) {
    throw new Error("Upload unavailable. Sign in again and retry.");
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (session && !sessionError) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (!userError && user) {
        return { userId: user.id, email: user.email };
      }
    }

    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession();

    if (!refreshError && refreshData.session) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (!userError && user) {
        return { userId: user.id, email: user.email };
      }
    }

    if (attempt === retries) {
      throw new Error(
        "Your session expired. Refresh the page and sign in again, then retry the upload.",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  throw new Error("Unable to confirm your session. Sign in again and retry.");
}

export function describeStorageUploadError(
  error: StorageErrorLike | null | undefined,
  bucket: string,
): string {
  const message = (error?.message || error?.error || "").toLowerCase();
  const status = String(error?.statusCode ?? "");

  if (
    message.includes("bucket") &&
    (message.includes("not found") || message.includes("not exist"))
  ) {
    return `Storage bucket "${bucket}" is missing. Studio cannot store this file until that bucket is created.`;
  }
  if (message.includes("mime type") && message.includes("not supported")) {
    return "That file type isn’t supported. Use a JPG, JPEG, PNG, or WebP.";
  }
  if (
    message.includes("maximum") ||
    message.includes("too large") ||
    message.includes("payload") ||
    message.includes("exceeded")
  ) {
    return "That file is too large for storage. Try a smaller JPG or PNG.";
  }
  if (
    message.includes("row-level security") ||
    message.includes("unauthorized") ||
    status === "403" ||
    message.includes("403")
  ) {
    return "Upload was blocked by storage permissions. Sign out, sign back in, and try again.";
  }
  if (message.includes("duplicate") || message.includes("already exists")) {
    return "A file with that name already exists. Try uploading again.";
  }
  if (message.includes("jwt") || message.includes("session")) {
    return "Your session expired. Refresh the page and sign in again.";
  }

  const detail = error?.message || error?.error;
  return detail ? `Upload failed: ${detail}` : "Failed to upload the file.";
}

function uploadTimeoutMs(fileSize: number): number {
  const megabytes = Math.max(1, fileSize / (1024 * 1024));
  return Math.min(10 * 60 * 1000, Math.max(45_000, Math.ceil(megabytes * 4000)));
}

async function uploadViaSignedUrl(
  bucket: string,
  storagePath: string,
  file: File,
): Promise<string | null> {
  if (typeof window === "undefined" || !supabase) return null;

  const contentType = inferredContentType(file);
  const response = await fetch("/api/studio/uploads/sign", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, path: storagePath, contentType }),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      "Your session expired. Refresh the page and sign in again, then retry the upload.",
    );
  }

  if (!response.ok) return null;

  const payload = (await response.json().catch(() => null)) as
    | { token?: string; path?: string }
    | null;
  if (!payload?.token || !payload?.path) return null;

  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(payload.path, payload.token, file, { contentType });

  if (error) {
    console.error("signed upload error", error);
    return null;
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(payload.path);
  return urlData?.publicUrl || null;
}

async function uploadToBucket(
  bucket: string,
  storagePath: string,
  file: File,
): Promise<string> {
  if (!supabase) {
    throw new Error("Upload unavailable. Sign in again and retry.");
  }

  const signedUrl = await uploadViaSignedUrl(bucket, storagePath, file);
  if (signedUrl) return signedUrl;

  const uploadPromise = supabase.storage.from(bucket).upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: inferredContentType(file),
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error("Upload timed out. Check your connection and try again.")),
      uploadTimeoutMs(file.size),
    );
  });

  const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

  if (error) {
    throw new Error(describeStorageUploadError(error, bucket));
  }
  if (!data?.path) {
    throw new Error("Upload succeeded but no file path was returned.");
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  if (!urlData?.publicUrl) {
    throw new Error("Upload succeeded but a public URL could not be created.");
  }

  return urlData.publicUrl;
}

export type StudioUploadOptions = {
  file: File;
  bucket?: string;
  path?: string;
  storagePath?: string;
  fallbackBuckets?: string[];
  maxSizeMb?: number;
  requireImage?: boolean;
};

export async function uploadPublicFile({
  file: originalFile,
  bucket = DEFAULT_UPLOAD_BUCKET,
  path = "",
  storagePath: storagePathOverride,
  fallbackBuckets = [],
  maxSizeMb,
  requireImage = false,
}: StudioUploadOptions): Promise<string> {
  if (requireImage) {
    if (isHeicLikeFile(originalFile)) {
      throw new Error(
        "iPhone HEIC photos aren’t supported. Export or share the image as JPG or PNG, then upload that file.",
      );
    }
    if (!isSupportedStudioImageFile(originalFile)) {
      throw new Error("Please choose a JPG, PNG, or WebP image.");
    }
  }

  const file = originalFile.type.startsWith("image/")
    ? await optimizeImageForUpload(originalFile)
    : originalFile;

  if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
    throw new Error(`That file is too large. Maximum size is ${maxSizeMb}MB.`);
  }

  const { userId } = await ensureValidSession();
  const extension = safeStorageExtension(
    file,
    fileExtension(file).replace(/^\./, "") || "bin",
  );
  const uniqueFileName = `${userId.slice(0, 8)}_${Date.now()}.${extension}`;
  const storagePath =
    storagePathOverride || storagePathForUpload(path, uniqueFileName);

  const buckets = [
    bucket,
    ...fallbackBuckets.filter((name) => name && name !== bucket),
  ];
  let lastError: unknown;

  for (const target of buckets) {
    try {
      return await uploadToBucket(target, storagePath, file);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const isValidationError =
        message.includes("heic") ||
        message.includes("too large") ||
        message.includes("timed out") ||
        message.includes("session expired") ||
        message.includes("sign in") ||
        message.includes("file type") ||
        message.includes("jpg, png");
      const canFallback =
        target !== buckets[buckets.length - 1] && !isValidationError;
      if (!canFallback) throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to upload the file.");
}
