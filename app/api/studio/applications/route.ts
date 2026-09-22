import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { loadStudioApplications } from "@/lib/studio/loadStudioApplications";

// Force dynamic rendering to prevent caching
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authz = await requireSuperAdmin();
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    const supabase = await getAdminClient();

    if (!supabase) {
      console.error("❌ Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    const applications = await loadStudioApplications(supabase);

    return NextResponse.json({
      applications,
      count: applications.length,
    });
  } catch (error) {
    console.error("💥 Error in applications API:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}
