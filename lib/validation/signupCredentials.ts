const EMAIL_MAX = 320;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 1024;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParsedSignupBody = { email: string; password: string };

export function parseSignupCredentials(body: unknown):
  | { ok: true; value: ParsedSignupBody }
  | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "Invalid request body" };
  }
  const rec = body as Record<string, unknown>;
  const emailRaw = rec.email;
  const passwordRaw = rec.password;

  if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") {
    return { ok: false, error: "Email and password are required" };
  }

  const email = emailRaw.trim();
  const password = passwordRaw;

  if (!email || !password) {
    return { ok: false, error: "Email and password are required" };
  }

  if (email.length > EMAIL_MAX || password.length > PASSWORD_MAX) {
    return { ok: false, error: "Invalid email or password" };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Invalid email format" };
  }

  if (password.length < PASSWORD_MIN) {
    return {
      ok: false,
      error: `Password must be at least ${PASSWORD_MIN} characters`,
    };
  }

  return { ok: true, value: { email, password } };
}

/** Map Supabase Auth errors to stable client-facing messages (no raw provider text). */
export function publicSignUpErrorMessage(providerMessage: string): string {
  const m = providerMessage.toLowerCase();
  if (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already exists")
  ) {
    return "An account with this email already exists.";
  }
  if (m.includes("password") && m.includes("weak")) {
    return "Password does not meet security requirements.";
  }
  if (m.includes("invalid login credentials")) {
    return "Unable to create account. Please try again.";
  }
  if (m.includes("email") && (m.includes("invalid") || m.includes("format"))) {
    return "Invalid email address.";
  }
  return "Unable to create account. Please try again.";
}
