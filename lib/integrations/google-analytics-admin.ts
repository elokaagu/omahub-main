import { importPKCS8, SignJWT } from "jose";
import { z } from "zod";

const googleServiceAccountSchema = z.object({
  client_email: z.string().email(),
  private_key: z.string().min(1),
});

export type GoogleServiceAccountCredentials = z.infer<
  typeof googleServiceAccountSchema
>;

const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const TOKEN_AUDIENCE = "https://oauth2.googleapis.com/token";

let accessTokenCache: {
  token: string;
  expiresAtMs: number;
} | null = null;

type ReportCacheEntry = { pageViews: number; cachedAtMs: number };
const reportCache = new Map<string, ReportCacheEntry>();

const REPORT_TTL_MS = 5 * 60 * 1000;
const TOKEN_SKEW_MS = 60 * 1000;

export function parseServiceAccountKey(
  raw: string
): GoogleServiceAccountCredentials | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = googleServiceAccountSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function signServiceAccountJwt(
  credentials: GoogleServiceAccountCredentials
): Promise<string> {
  const privateKey = await importPKCS8(
    credentials.private_key.replace(/\\n/g, "\n"),
    "RS256"
  );

  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ scope: GA_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(credentials.client_email)
    .setSubject(credentials.client_email)
    .setAudience(TOKEN_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);
}

async function getGoogleAccessToken(
  credentials: GoogleServiceAccountCredentials
): Promise<string | null> {
  const now = Date.now();
  if (
    accessTokenCache &&
    accessTokenCache.expiresAtMs > now + TOKEN_SKEW_MS
  ) {
    return accessTokenCache.token;
  }

  try {
    const assertion = await signServiceAccountJwt(credentials);
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google OAuth token request failed:", response.status);
      if (process.env.NODE_ENV === "development") {
        console.error("Google OAuth error body (dev only):", errorText);
      }
      return null;
    }

    const data = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!data.access_token) {
      return null;
    }

    const expiresInSec =
      typeof data.expires_in === "number" && data.expires_in > 120
        ? data.expires_in
        : 3600;
    accessTokenCache = {
      token: data.access_token,
      expiresAtMs: now + (expiresInSec * 1000 - TOKEN_SKEW_MS),
    };
    return data.access_token;
  } catch (err) {
    console.error("Error obtaining Google access token:", err);
    return null;
  }
}

export type Ga4PageViewsResult =
  | {
      ok: true;
      pageViews: number;
      source: "google-analytics";
      period: string;
      lastUpdated: string;
    }
  | {
      ok: false;
      pageViews: null;
      message: string;
      source: "estimated";
    };

/**
 * Fetches aggregate screenPageViews for the property for the last 30 days.
 * Caches the report briefly and reuses access tokens until near expiry.
 */
export async function fetchGa4Last30DayPageViews(
  propertyId: string,
  credentials: GoogleServiceAccountCredentials
): Promise<Ga4PageViewsResult> {
  const endDate = new Date().toISOString().split("T")[0];
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const startDateStr = start.toISOString().split("T")[0];
  const period = "30 days";
  const cacheKey = `${propertyId}:${startDateStr}:${endDate}`;

  const cached = reportCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.cachedAtMs < REPORT_TTL_MS) {
    return {
      ok: true,
      pageViews: cached.pageViews,
      source: "google-analytics",
      period,
      lastUpdated: new Date(cached.cachedAtMs).toISOString(),
    };
  }

  const accessToken = await getGoogleAccessToken(credentials);
  if (!accessToken) {
    return {
      ok: false,
      pageViews: null,
      message: "Failed to authenticate with Google Analytics.",
      source: "estimated",
    };
  }

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: startDateStr, endDate }],
        metrics: [{ name: "screenPageViews" }],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Analytics Data API error:", response.status);
    if (process.env.NODE_ENV === "development") {
      console.error("GA Data API error body (dev only):", errorText);
    }
    return {
      ok: false,
      pageViews: null,
      message: "Google Analytics API request failed.",
      source: "estimated",
    };
  }

  const data = (await response.json()) as {
    rows?: Array<{ metricValues?: Array<{ value?: string }> }>;
  };
  const totalPageViews = data.rows?.[0]?.metricValues?.[0]?.value
    ? parseInt(data.rows[0].metricValues[0].value, 10)
    : 0;

  reportCache.set(cacheKey, { pageViews: totalPageViews, cachedAtMs: now });

  return {
    ok: true,
    pageViews: totalPageViews,
    source: "google-analytics",
    period,
    lastUpdated: new Date().toISOString(),
  };
}
