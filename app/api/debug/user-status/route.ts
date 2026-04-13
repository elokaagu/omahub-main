import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { isDebugApiAllowed } from "@/lib/debug/debugApiAccess";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export const dynamic = "force-dynamic";

type Check = "ok" | "fail";

/**
 * Super-admin-only coarse health checks for session DB paths (no PII or row payloads).
 *
 * `checks.profile_row` — can read own `profiles.id` under RLS.
 * `checks.brands_probe` — can run a minimal `brands` read (RLS as super_admin).
 *
 * Production: set `ENABLE_DEBUG_USER_STATUS=true` or returns 404.
 */
export async function GET() {
  if (!isDebugApiAllowed("ENABLE_DEBUG_USER_STATUS")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireSuperAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase, userId } = auth;

  try {
    const profile_row = await probeProfileRow(supabase, userId);
    const brands_probe = await probeBrandsReadable(supabase);

    const checks = {
      profile_row,
      brands_probe,
    };

    const ok = profile_row === "ok" && brands_probe === "ok";

    const res = NextResponse.json({
      ok,
      checkedAt: new Date().toISOString(),
      checks,
    });
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (e) {
    console.error(
      JSON.stringify({
        event: "debug_user_status_unhandled",
        name: e instanceof Error ? e.name : "unknown",
      })
    );
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}

async function probeProfileRow(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<Check> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      JSON.stringify({
        event: "debug_user_status_profile_probe",
        code: error.code ?? "unknown",
      })
    );
    return "fail";
  }
  if (!data) {
    console.error(
      JSON.stringify({ event: "debug_user_status_profile_probe", code: "no_row" })
    );
    return "fail";
  }
  return "ok";
}

async function probeBrandsReadable(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<Check> {
  const { error } = await supabase.from("brands").select("id").limit(1);

  if (error) {
    console.error(
      JSON.stringify({
        event: "debug_user_status_brands_probe",
        code: error.code ?? "unknown",
      })
    );
    return "fail";
  }
  return "ok";
}
