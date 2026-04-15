/**
 * Safe to import from modules that also run in the browser (e.g. brandService).
 * Never statically imports `supabase-admin` (marked `server-only`), so the service
 * role bundle is not pulled into client chunks.
 */
export async function getAdminClientLazy() {
  if (typeof window !== "undefined") {
    return null;
  }
  const { getAdminClient } = await import("@/lib/supabase-admin");
  return getAdminClient();
}
