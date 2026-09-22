import type { SupabaseClient } from "@supabase/supabase-js";

export type StudioApplicationCounts = { total: number; new: number };

/**
 * Total and unreviewed designer applications, as two `head` count queries
 * (no rows transferred). Pass a service-role client; returns null on error.
 */
export async function countStudioApplications(
  admin: SupabaseClient,
): Promise<StudioApplicationCounts | null> {
  const [all, fresh] = await Promise.all([
    admin
      .from("designer_applications")
      .select("id", { count: "exact", head: true }),
    admin
      .from("designer_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  if (all.error || fresh.error) {
    console.error(
      "[studio] application counts:",
      all.error?.message ?? fresh.error?.message,
    );
    return null;
  }

  return { total: all.count ?? 0, new: fresh.count ?? 0 };
}
