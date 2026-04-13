import type { createServerSupabaseClient } from "@/lib/supabase-unified";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export const PLATFORM_VISIBILITY_KEY = "platform_visibility";

export type PlatformVisibility = "public" | "private";

/**
 * When no `platform_settings` row exists for {@link PLATFORM_VISIBILITY_KEY},
 * the product treats visibility as non-public (private / password-gate–safe).
 */
export const PLATFORM_VISIBILITY_EFFECTIVE_WHEN_MISSING: PlatformVisibility =
  "private";

export async function getPlatformVisibility(
  supabase: ServerSupabase
): Promise<string | null> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", PLATFORM_VISIBILITY_KEY)
    .maybeSingle();

  if (error) {
    console.error("getPlatformVisibility:", error.code, error.message);
    return null;
  }
  return data?.value ?? null;
}

export type SetPlatformVisibilityResult =
  | {
      ok: true;
      previousValue: string | null;
      newValue: PlatformVisibility;
      changed: boolean;
    }
  | { ok: false; error: string };

export type PlatformVisibilityAuditAction =
  | "enable_password_gate"
  | "disable_password_gate";

/**
 * Idempotent upsert for `platform_visibility` in `platform_settings` (source of truth).
 * Route-level cookies or flags must stay secondary to this value.
 * Logs structured audit (always); best-effort `platform_settings_events` insert when migrated.
 */
export async function setPlatformVisibility(
  supabase: ServerSupabase,
  newValue: PlatformVisibility,
  actorUserId: string,
  action: PlatformVisibilityAuditAction
): Promise<SetPlatformVisibilityResult> {
  const previousRaw = await getPlatformVisibility(supabase);
  const previousValue = previousRaw ?? null;

  if (previousValue === newValue) {
    await recordVisibilityAudit(supabase, {
      actorUserId,
      action,
      previousValue,
      newValue,
      changed: false,
    });
    return {
      ok: true,
      previousValue,
      newValue,
      changed: false,
    };
  }

  const { error: dbError } = await supabase.from("platform_settings").upsert(
    [
      {
        key: PLATFORM_VISIBILITY_KEY,
        value: newValue,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "key" }
  );

  if (dbError) {
    console.error(
      "setPlatformVisibility upsert failed:",
      dbError.code,
      dbError.message
    );
    return { ok: false, error: "Failed to update platform visibility" };
  }

  await recordVisibilityAudit(supabase, {
    actorUserId,
    action,
    previousValue,
    newValue,
    changed: true,
  });

  return {
    ok: true,
    previousValue,
    newValue,
    changed: true,
  };
}

async function recordVisibilityAudit(
  supabase: ServerSupabase,
  payload: {
    actorUserId: string;
    action: PlatformVisibilityAuditAction;
    previousValue: string | null;
    newValue: PlatformVisibility;
    changed: boolean;
  }
) {
  const line = {
    event: "platform_visibility_change",
    setting_key: PLATFORM_VISIBILITY_KEY,
    actor_user_id: payload.actorUserId,
    action: payload.action,
    previous_value: payload.previousValue,
    new_value: payload.newValue,
    changed: payload.changed,
    at: new Date().toISOString(),
  };
  console.log(JSON.stringify(line));

  const { error } = await supabase.from("platform_settings_events").insert({
    setting_key: PLATFORM_VISIBILITY_KEY,
    previous_value: payload.previousValue,
    new_value: payload.newValue,
    action: payload.action,
    actor_id: payload.actorUserId,
    changed: payload.changed,
  });

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    if (
      msg.includes("does not exist") ||
      msg.includes("schema cache") ||
      error.code === "42P01"
    ) {
      return;
    }
    console.warn(
      "platform_settings_events insert failed:",
      error.code,
      error.message
    );
  }
}
