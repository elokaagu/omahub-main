/**
 * Best-effort per-instance sliding window limiter for public newsletter subscribe POSTs.
 */
const buckets = new Map<string, number[]>();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 8;

export function checkNewsletterSubscribeRateLimit(clientKey: string): boolean {
  const windowMs =
    Number(process.env.NEWSLETTER_RATE_LIMIT_WINDOW_MS) || DEFAULT_WINDOW_MS;
  const max = Number(process.env.NEWSLETTER_RATE_LIMIT_MAX) || DEFAULT_MAX;
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

export function getNewsletterSubscribeClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return `newsletter:${first}`;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return `newsletter:${realIp.trim()}`;
  return "newsletter:unknown";
}
