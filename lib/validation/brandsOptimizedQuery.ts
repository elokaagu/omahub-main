/** Public-selectable `brands` columns for `/api/brands/optimized` (no emails / owner ids). */
export const ALLOWED_BRAND_PUBLIC_FIELDS = new Set([
  "id",
  "name",
  "image",
  "category",
  "location",
  "is_verified",
  "description",
  "logo_url",
  "website",
  "created_at",
  "updated_at",
  "video_url",
  "video_thumbnail",
  "currency",
  "categories",
]);

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const CATEGORY_MAX = 120;

export type ParsedBrandsOptimizedQuery = {
  category?: string;
  limit: number;
  fields?: string[];
  /** In-memory cache in performanceService (not CDN). */
  useCache: boolean;
};

export function parseBrandsOptimizedQuery(
  searchParams: URLSearchParams
):
  | { ok: true; value: ParsedBrandsOptimizedQuery }
  | { ok: false; error: string } {
  const limitRaw = searchParams.get("limit");
  let limit = DEFAULT_LIMIT;
  if (limitRaw !== null && limitRaw !== "") {
    const n = Number.parseInt(limitRaw, 10);
    if (!Number.isFinite(n) || n < 1) {
      return { ok: false, error: "Invalid limit" };
    }
    if (n > MAX_LIMIT) {
      return { ok: false, error: "Limit cannot exceed 100" };
    }
    limit = n;
  }

  const categoryRaw = searchParams.get("category");
  let category: string | undefined;
  if (categoryRaw !== null && categoryRaw !== "") {
    const c = categoryRaw.trim();
    if (c.length > CATEGORY_MAX) {
      return { ok: false, error: "Invalid category" };
    }
    if (/[\x00-\x1f<>]/.test(c)) {
      return { ok: false, error: "Invalid category" };
    }
    category = c;
  }

  const fieldsRaw = searchParams.get("fields");
  let fields: string[] | undefined;
  if (fieldsRaw !== null && fieldsRaw !== "") {
    const requested = fieldsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const allowed = requested.filter((f) => ALLOWED_BRAND_PUBLIC_FIELDS.has(f));
    if (allowed.length === 0) {
      return { ok: false, error: "No allowed fields in fields parameter" };
    }
    fields = [...new Set(allowed)];
  }

  const cacheParam = searchParams.get("cache");
  let useCache = true;
  if (cacheParam === "false") {
    if (process.env.NODE_ENV === "development") {
      useCache = false;
    }
  } else if (cacheParam !== null && cacheParam !== "" && cacheParam !== "true") {
    return { ok: false, error: "Invalid cache parameter" };
  }

  return { ok: true, value: { category, limit, fields, useCache } };
}
