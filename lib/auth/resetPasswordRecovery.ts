/**
 * Parse Supabase-style hash fragments (#access_token=...&refresh_token=...).
 */
export function parseHashParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  const params: Record<string, string> = {};
  for (const part of hash.split("&")) {
    const [key, value] = part.split("=");
    if (key && value != null) {
      params[key] = decodeURIComponent(value);
    }
  }
  return params;
}

export type RecoveryTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

/**
 * Prefer hash tokens (Supabase email default), then query string.
 */
export function getRecoveryTokensFromUrl(
  searchParams: Pick<URLSearchParams, "get">
): RecoveryTokens {
  const hash = typeof window !== "undefined" ? parseHashParams() : {};
  return {
    accessToken: hash.access_token ?? searchParams.get("access_token"),
    refreshToken: hash.refresh_token ?? searchParams.get("refresh_token"),
  };
}
