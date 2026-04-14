/**
 * OAuth / auth-callback query params on `/login` (single source: Next `useSearchParams`).
 */

function safeDecode(param: string | null): string | null {
  if (param == null || param === "") return null;
  try {
    return decodeURIComponent(param.replace(/\+/g, " "));
  } catch {
    return param;
  }
}

export function mapOAuthErrorToFriendlyMessage(
  decodedError: string,
  errorDescription: string | null
): string {
  const known: Record<string, string> = {
    callback_error:
      "There was an issue completing your sign-in. Please try again.",
    access_denied: "Access was denied. Please try signing in again.",
    service_unavailable:
      "Authentication service is temporarily unavailable.",
    session_error: "Session creation failed. Please try signing in again.",
    unexpected_error:
      "An unexpected error occurred during sign-in. Please try again.",
    no_code: "Authorization failed. Please try signing in again.",
  };

  if (known[decodedError]) return known[decodedError];
  if (errorDescription) return errorDescription;
  return "Authentication failed. Please try again.";
}

export type LoginUrlDerivedState = {
  callbackError: string | null;
  infoMessage: string | null;
  debugJson: string | null;
};

/**
 * Derive UI state from login page search params (read-only API compatible with `URLSearchParams`).
 */
export function deriveLoginUrlState(
  searchParams: Pick<URLSearchParams, "get">,
  isDev: boolean
): LoginUrlDerivedState {
  const errorRaw = searchParams.get("error");
  if (!errorRaw) {
    return {
      callbackError: null,
      infoMessage: safeDecode(searchParams.get("message")),
      debugJson: null,
    };
  }

  const decodedError = safeDecode(errorRaw) ?? errorRaw;
  const errorDescription = safeDecode(searchParams.get("error_description"));
  const details = safeDecode(searchParams.get("details"));

  const friendly = mapOAuthErrorToFriendlyMessage(
    decodedError,
    errorDescription
  );

  let debugJson: string | null = null;
  if (isDev) {
    debugJson = JSON.stringify(
      {
        error: decodedError,
        description: errorDescription,
        details,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  }

  return {
    callbackError: friendly,
    infoMessage: safeDecode(searchParams.get("message")),
    debugJson,
  };
}
