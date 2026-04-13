import { z } from "zod";

const vercelPageviewEntrySchema = z
  .object({
    count: z.number().optional(),
  })
  .passthrough();

const vercelPageviewsApiSchema = z
  .object({
    pageviews: z.array(vercelPageviewEntrySchema).optional(),
  })
  .passthrough();

export type VercelPageviewsSummaryResult =
  | {
      ok: true;
      pageViews: number;
      source: "vercel";
      period: string;
      lastUpdated: string;
      entryCount: number;
    }
  | {
      ok: false;
      pageViews: null;
      message: string;
      source: "estimated";
    };

const REPORT_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  result: Extract<VercelPageviewsSummaryResult, { ok: true }>;
  cachedAtMs: number;
};

const reportCache = new Map<string, CacheEntry>();

function sumPageviewsFromPayload(data: unknown): { total: number; entryCount: number } {
  const parsed = vercelPageviewsApiSchema.safeParse(data);
  if (!parsed.success || !parsed.data.pageviews) {
    return { total: 0, entryCount: 0 };
  }
  const total = parsed.data.pageviews.reduce(
    (acc, entry) => acc + (typeof entry.count === "number" ? entry.count : 0),
    0
  );
  return { total, entryCount: parsed.data.pageviews.length };
}

export async function fetchVercelPageviewsLast30Days(): Promise<VercelPageviewsSummaryResult> {
  const accessToken = process.env.VERCEL_ACCESS_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!accessToken) {
    return {
      ok: false,
      pageViews: null,
      message: "Vercel Analytics not configured. Using estimated page views.",
      source: "estimated",
    };
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const period = "30 days";

  const params = new URLSearchParams({
    since: startDate.toISOString(),
    until: endDate.toISOString(),
    ...(teamId && { teamId }),
    ...(projectId && { projectId }),
  });

  const cacheKey = params.toString();
  const cached = reportCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.cachedAtMs < REPORT_TTL_MS) {
    return {
      ...cached.result,
      lastUpdated: new Date(cached.cachedAtMs).toISOString(),
    };
  }

  const response = await fetch(
    `https://api.vercel.com/v1/analytics/pageviews?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Vercel Analytics API error:", response.status);
    if (process.env.NODE_ENV === "development") {
      console.error("Vercel Analytics error body (dev only):", errorText);
    }
    return {
      ok: false,
      pageViews: null,
      message: "Vercel Analytics API request failed.",
      source: "estimated",
    };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return {
      ok: false,
      pageViews: null,
      message: "Invalid response from Vercel Analytics.",
      source: "estimated",
    };
  }

  const { total, entryCount } = sumPageviewsFromPayload(json);

  const result: Extract<VercelPageviewsSummaryResult, { ok: true }> = {
    ok: true,
    pageViews: total,
    source: "vercel",
    period,
    lastUpdated: new Date().toISOString(),
    entryCount,
  };

  reportCache.set(cacheKey, { result, cachedAtMs: now });

  return result;
}
