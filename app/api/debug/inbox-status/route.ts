import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { isDebugApiAllowed } from "@/lib/debug/debugApiAccess";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export const dynamic = "force-dynamic";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;
type Check = "ok" | "fail";

/**
 * Super-admin inbox health (coarse summary only).
 *
 * Response `checks.datastore_1|2|3` map to server-side probes of, in order:
 * `inquiries`, `inquiry_replies`, `inquiries_with_details` (not named in JSON).
 *
 * Production: set `ENABLE_DEBUG_INBOX_STATUS=true` or returns 404.
 */
export async function GET() {
  if (!isDebugApiAllowed("ENABLE_DEBUG_INBOX_STATUS")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireSuperAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { supabase } = auth;

  try {
    const [datastore_1, datastore_2, datastore_3] = await Promise.all([
      probeInboxResource(supabase, "inquiries", 1),
      probeInboxResource(supabase, "inquiry_replies", 2),
      probeInboxResource(supabase, "inquiries_with_details", 3),
    ]);

    const checks = {
      datastore_1,
      datastore_2,
      datastore_3,
    };

    const ok =
      datastore_1 === "ok" &&
      datastore_2 === "ok" &&
      datastore_3 === "ok";

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
        event: "debug_inbox_status_unhandled",
        name: e instanceof Error ? e.name : "unknown",
      })
    );
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}

async function probeInboxResource(
  supabase: ServerSupabase,
  relation: string,
  targetIndex: number
): Promise<Check> {
  try {
    const { error } = await supabase
      .from(relation)
      .select("id")
      .limit(1);

    if (error) {
      console.error(
        JSON.stringify({
          event: "debug_inbox_status_probe",
          target: targetIndex,
          code: error.code ?? "unknown",
        })
      );
      return "fail";
    }
    return "ok";
  } catch {
    console.error(
      JSON.stringify({
        event: "debug_inbox_status_probe_exception",
        target: targetIndex,
      })
    );
    return "fail";
  }
}
