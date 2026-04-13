import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { isDebugApiAllowed } from "@/lib/debug/debugApiAccess";

export const dynamic = "force-dynamic";

/**
 * Super-admin diagnostics: whether `inquiries` exists and optional column metadata.
 * Production: set `ENABLE_DEBUG_INQUIRIES_TABLE=true` or returns 404.
 */
export async function GET() {
  if (!isDebugApiAllowed("ENABLE_DEBUG_INQUIRIES_TABLE")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireSuperAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const supabase = await getAdminClient();
    if (!supabase) {
      console.error(
        JSON.stringify({ event: "debug_inquiries_check_admin_client_missing" })
      );
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    const { error } = await supabase.from("inquiries").select("id").limit(1);

    if (error?.code === "42P01") {
      console.error(
        JSON.stringify({
          event: "debug_inquiries_table_missing",
          code: error.code,
        })
      );
      return NextResponse.json({
        exists: false,
        message:
          "Inquiries table was not found. Create it using a Supabase migration or the SQL editor.",
      });
    }

    if (error) {
      console.error(
        JSON.stringify({
          event: "debug_inquiries_probe_failed",
          code: error.code ?? "unknown",
        })
      );
      return NextResponse.json({
        exists: false,
        message: "Unable to verify the inquiries table.",
      });
    }

    const { data: columns, error: columnsError } = await supabase.rpc(
      "get_table_columns",
      { table_name: "inquiries" }
    );

    if (columnsError) {
      console.error(
        JSON.stringify({
          event: "debug_inquiries_columns_rpc_failed",
          code: columnsError.code ?? "unknown",
        })
      );
      return NextResponse.json({
        exists: true,
        message: "Inquiries table exists and is accessible.",
        structureAvailable: false,
      });
    }

    const res = NextResponse.json({
      exists: true,
      message: "Inquiries table exists and is ready.",
      structureAvailable: true,
      columns: columns ?? [],
    });
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (e) {
    console.error(
      JSON.stringify({
        event: "debug_inquiries_check_unhandled",
        name: e instanceof Error ? e.name : "unknown",
      })
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
