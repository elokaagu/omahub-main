const buckets = new Map<string, number[]>();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 6;

export function checkCustomOrderRateLimit(clientKey: string): boolean {
  const windowMs =
    Number(process.env.CUSTOM_ORDER_RATE_LIMIT_WINDOW_MS) || DEFAULT_WINDOW_MS;
  const max = Number(process.env.CUSTOM_ORDER_RATE_LIMIT_MAX) || DEFAULT_MAX;
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

export function getCustomOrderClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return `custom-order:${first}`;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return `custom-order:${realIp.trim()}`;
  return "custom-order:unknown";
}
