/**
 * For public, visitor-independent GET responses only (no cookies, no
 * per-user data). Vercel's CDN keeps the response for 60s and serves a stale
 * copy for up to 5 minutes while it refreshes; browsers don't cache it
 * themselves, so a change shows up within a minute.
 *
 * Signed-in / per-user routes must NOT use this - leave them uncached.
 */
export const PUBLIC_CDN_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
} as const;

export const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;
