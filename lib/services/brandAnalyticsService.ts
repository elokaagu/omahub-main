import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_BRAND_ANALYTICS_IDS = 50;
export const MAX_BRAND_ID_LENGTH = 128;

/** Slug-style brand ids (e.g. ebhs-couture) and UUIDs. */
const BRAND_ID_RE =
  /^(?:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|[a-zA-Z0-9][a-zA-Z0-9._-]*)$/;

export type ParsedBrandIds =
  | { ok: true; ids: string[] }
  | { ok: false; error: string; status: number };

export function parseBrandIdsParam(raw: string | null): ParsedBrandIds {
  if (raw == null || !String(raw).trim()) {
    return { ok: false, error: "Brand IDs required", status: 400 };
  }

  const ids = [
    ...new Set(
      String(raw)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ];

  if (ids.length === 0) {
    return { ok: false, error: "No valid brand IDs provided", status: 400 };
  }

  if (ids.length > MAX_BRAND_ANALYTICS_IDS) {
    return { ok: false, error: "Too many brand IDs requested", status: 400 };
  }

  for (const id of ids) {
    if (id.length > MAX_BRAND_ID_LENGTH) {
      return { ok: false, error: "Invalid brand ID format", status: 400 };
    }
    if (!BRAND_ID_RE.test(id)) {
      return { ok: false, error: "Invalid brand ID format", status: 400 };
    }
  }

  return { ok: true, ids };
}

export function startOfCurrentMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export type BrandAnalyticsProfile = {
  role: string | null;
  owned_brands: string[] | null;
};

export type BrandAnalyticsAccess =
  | { ok: true }
  | { ok: false; status: number; error: string };

export function assertBrandAnalyticsAccess(
  profile: BrandAnalyticsProfile | null,
  brandIds: string[]
): BrandAnalyticsAccess {
  if (!profile) {
    return { ok: false, status: 404, error: "Profile not found" };
  }

  if (profile.role === "brand_admin") {
    const owned = profile.owned_brands ?? [];
    const allowed = brandIds.every((id) => owned.includes(id));
    if (!allowed) {
      return { ok: false, status: 403, error: "Access denied" };
    }
    return { ok: true };
  }

  if (profile.role === "super_admin") {
    return { ok: true };
  }

  return { ok: false, status: 403, error: "Insufficient permissions" };
}

export type BrandAnalyticsPayload = {
  totalBrands: number;
  totalProducts: number;
  totalReviews: number;
  averageRating: number;
  recentReviews: number;
};

type AnalyticsResult =
  | { ok: true; data: BrandAnalyticsPayload }
  | { ok: false; error: string };

/**
 * Loads aggregate counts and review stats for the given brand ids.
 * Tries DB-side review aggregates first; falls back if PostgREST aggregates are unavailable.
 */
export async function loadBrandAnalytics(
  supabase: SupabaseClient,
  brandIds: string[]
): Promise<AnalyticsResult> {
  const startOfMonth = startOfCurrentMonthIso();

  const [
    brandsResult,
    productsResult,
    reviewsCountResult,
    recentReviewsResult,
    avgResult,
  ] = await Promise.all([
    supabase
      .from("brands")
      .select("id", { count: "exact", head: true })
      .in("id", brandIds),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .in("brand_id", brandIds),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .in("brand_id", brandIds),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .in("brand_id", brandIds)
      .gte("created_at", startOfMonth),
    supabase
      .from("reviews")
      .select("average_rating:rating.avg()")
      .in("brand_id", brandIds),
  ]);

  if (brandsResult.error) {
    console.error("[brandAnalytics] brands query failed", {
      code: brandsResult.error.code,
    });
    return { ok: false, error: "Failed to fetch analytics" };
  }
  if (productsResult.error) {
    console.error("[brandAnalytics] products query failed", {
      code: productsResult.error.code,
    });
    return { ok: false, error: "Failed to fetch analytics" };
  }
  if (reviewsCountResult.error) {
    console.error("[brandAnalytics] reviews count query failed", {
      code: reviewsCountResult.error.code,
    });
    return { ok: false, error: "Failed to fetch analytics" };
  }
  if (recentReviewsResult.error) {
    console.error("[brandAnalytics] recent reviews query failed", {
      code: recentReviewsResult.error.code,
    });
    return { ok: false, error: "Failed to fetch analytics" };
  }

  const totalBrands = brandsResult.count ?? 0;
  const totalProducts = productsResult.count ?? 0;
  const totalReviews = reviewsCountResult.count ?? 0;
  const recentReviews = recentReviewsResult.count ?? 0;

  let averageRating = 0;

  if (!avgResult.error && avgResult.data?.length) {
    const avg = (avgResult.data[0] as { average_rating?: number | null })
      .average_rating;
    averageRating =
      avg != null && !Number.isNaN(Number(avg)) ? Number(avg) : 0;
  } else {
    if (avgResult.error) {
      console.warn(
        "[brandAnalytics] rating.avg() unavailable; computing average in app",
        { code: avgResult.error.code }
      );
    }
    if (totalReviews === 0) {
      averageRating = 0;
    } else {
      const { data: ratingRows, error: ratingsError } = await supabase
        .from("reviews")
        .select("rating")
        .in("brand_id", brandIds);

      if (ratingsError) {
        console.error("[brandAnalytics] reviews rating scan failed", {
          code: ratingsError.code,
        });
        return { ok: false, error: "Failed to fetch analytics" };
      }

      const rows = ratingRows ?? [];
      if (rows.length > 0) {
        const sum = rows.reduce(
          (acc, r) => acc + (typeof r.rating === "number" ? r.rating : 0),
          0
        );
        averageRating = sum / rows.length;
      }
    }
  }

  return {
    ok: true,
    data: {
      totalBrands,
      totalProducts,
      totalReviews,
      averageRating,
      recentReviews,
    },
  };
}
