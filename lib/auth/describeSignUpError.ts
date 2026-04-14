/** Map Supabase / network signup failures to short UI copy. */
export function describeSignUpError(error: unknown): string {
  if (error instanceof Error) {
    const raw = error.message || "";
    const msg = raw.toLowerCase();

    if (
      msg.includes("already registered") ||
      msg.includes("already been registered") ||
      msg.includes("user already") ||
      msg.includes("email address is already")
    ) {
      return "An account with this email already exists. Sign in or use “Forgot password”.";
    }

    if (msg.includes("invalid email") || msg.includes("unable to validate email")) {
      return "Please enter a valid email address.";
    }

    if (msg.includes("password") && msg.includes("least")) {
      return raw;
    }

    if (
      msg.includes("rate limit") ||
      msg.includes("too many requests") ||
      msg.includes("email rate limit") ||
      msg.includes("over_email_send_rate_limit")
    ) {
      return "Too many attempts. Please wait a few minutes and try again.";
    }

    if (msg.includes("supabase client not available")) {
      return "Something went wrong. Please refresh the page and try again.";
    }

    if (raw.length > 0 && raw.length < 200) {
      return raw;
    }
  }

  return "Failed to create account. Please try again.";
}
