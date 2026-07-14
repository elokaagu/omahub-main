/**
 * Sliding-window limiter for public designer-application photo uploads.
 * Separate, more generous bucket than the application-submit limiter, since
 * a single applicant legitimately uploads up to 3 images before submitting.
 */
const buckets = new Map<string, number[]>();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 20;

export function checkDesignerApplicationImageUploadRateLimit(
  clientKey: string,
): boolean {
  const windowMs =
    Number(process.env.DESIGNER_APP_UPLOAD_RATE_LIMIT_WINDOW_MS) ||
    DEFAULT_WINDOW_MS;
  const max =
    Number(process.env.DESIGNER_APP_UPLOAD_RATE_LIMIT_MAX) || DEFAULT_MAX;
  const now = Date.now();

  const prev = buckets.get(clientKey) ?? [];
  const windowed = prev.filter((t) => now - t < windowMs);

  if (windowed.length >= max) {
    buckets.set(clientKey, windowed);
    return false;
  }

  windowed.push(now);
  buckets.set(clientKey, windowed);
  return true;
}
