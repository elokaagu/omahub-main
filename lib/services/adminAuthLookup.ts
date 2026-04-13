import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolve auth.users id by email (case-insensitive), paginating listUsers.
 * Prefer a dedicated Auth admin API when the platform adds email lookup.
 */
export async function findAuthUserIdByEmail(
  adminDb: SupabaseClient,
  email: string
): Promise<string | null> {
  const target = email.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;
  const maxPages = 100;

  while (page <= maxPages) {
    const { data, error } = await adminDb.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      console.error("adminAuthLookup listUsers failed:", error.message);
      return null;
    }

    const hit = data.users.find(
      (u) => (u.email ?? "").toLowerCase() === target
    );
    if (hit?.id) return hit.id;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}
