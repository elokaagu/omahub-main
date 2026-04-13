/**
 * Columns returned by GET /api/auth/profile (self-service, session-scoped).
 * Intentionally excludes any future sensitive columns not needed by the client.
 */
export const SELF_PROFILE_SELECT =
  "id, email, first_name, last_name, avatar_url, role, owned_brands" as const;
