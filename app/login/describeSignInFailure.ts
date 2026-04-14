/**
 * User-facing copy for failures from `signIn()` (fetch + `/api/auth/login` errors).
 */
export function describeSignInFailure(error: unknown): string {
  if (error instanceof SyntaxError) {
    return "We received an invalid response. Please try again.";
  }

  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg === "load failed"
    ) {
      return "We couldn’t reach the server. Check your connection and try again.";
    }
  }

  if (error instanceof Error) {
    const m = error.message;
    const lower = m.toLowerCase();

    if (
      lower.includes("invalid credentials") ||
      lower.includes("authentication failed") ||
      m === "Login failed"
    ) {
      return "Invalid email or password. Please try again.";
    }

    if (lower.includes("internal server error")) {
      return "Something went wrong on our side. Please try again in a moment.";
    }

    if (lower.includes("invalid json")) {
      return "We received an invalid response. Please try again.";
    }

    if (m.length > 0 && m.length < 160) {
      return m;
    }
  }

  return "Sign-in failed. Please try again.";
}
