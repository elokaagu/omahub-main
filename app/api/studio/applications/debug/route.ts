import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

/**
 * Debug endpoint to check applications and verify setup
 * This helps diagnose why applications might not be visible
 */
export async function GET(_request: NextRequest) {
  try {
    const authz = await requireSuperAdmin();
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    const supabase = await getAdminClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to initialize admin services" },
        { status: 500 }
      );
    }

    // Check total count
    const { count, error: countError } = await supabase
      .from("designer_applications")
      .select("id", { count: "exact", head: true });

    // Fetch a small sample only for coarse health checks
    const { data: applications, error: fetchError } = await supabase
      .from("designer_applications")
      .select("id")
      .limit(5);

    const healthy = !countError && !fetchError;

    return NextResponse.json({
      success: healthy,
      checks: {
        adminClientReady: true,
        countQueryOk: !countError,
        sampleQueryOk: !fetchError,
      },
      totalCount: typeof count === "number" ? count : null,
      sampleSize: applications?.length ?? 0,
    });

  } catch (error) {
    console.error("💥 Error in studio applications debug API:", error);
    return NextResponse.json({
      error: "Internal server error",
    }, { status: 500 });
  }
}

