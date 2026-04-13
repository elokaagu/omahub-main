const EMAIL_MAX = 320;
const PASSWORD_MAX = 1024;
/** Loose RFC-style check — Supabase remains source of truth for deliverability. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParsedLoginBody = { email: string; password: string };

export function parseLoginCredentials(body: unknown):
  | { ok: true; value: ParsedLoginBody }
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

  return { ok: true, value: { email, password } };
}
