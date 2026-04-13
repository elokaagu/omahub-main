/**
 * Public API path segment for `brands/[id]/…` (UUID or slug-like id).
 */
export function parsePublicBrandIdParam(raw: string | undefined):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  if (raw == null || typeof raw !== "string") {
    return { ok: false, error: "Invalid brand id" };
  }
  const value = raw.trim();
  if (!value || value.length > 200) {
    return { ok: false, error: "Invalid brand id" };
  }
  if (/[\s#?&<>'"]/.test(value)) {
    return { ok: false, error: "Invalid brand id" };
  }
  return { ok: true, value };
}

/** Hard cap when client passes `?limit=` (omitting `limit` returns full in-stock set). */
const MAX_LIMIT = 500;

export function parseProductListLimit(
  searchParams: URLSearchParams
): { ok: true; value: number | null } | { ok: false; error: string } {
  const raw = searchParams.get("limit");
  if (raw === null || raw === "") {
    return { ok: true, value: null };
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return { ok: false, error: "Invalid limit" };
  }
  return { ok: true, value: Math.min(n, MAX_LIMIT) };
}
