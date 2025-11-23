import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

/**
 * Debug endpoint to check applications and verify setup
 * This helps diagnose why applications might not be visible
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getAdminClient();
    
    if (!supabase) {
      return NextResponse.json({
        error: "Failed to get admin client",
        config: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }
      }, { status: 500 });
    }

    // Check total count
    const { count, error: countError } = await supabase
      .from("designer_applications")
      .select("*", { count: "exact", head: true });

    // Fetch all applications
    const { data: applications, error } = await supabase
      .from("designer_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({
        error: "Failed to fetch applications",
        details: error.message,
        code: error.code,
        hint: error.hint,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      totalCount: count || 0,
      applicationsCount: applications?.length || 0,
      applications: applications?.map((app: any) => ({
        id: app.id,
        brand_name: app.brand_name,
        email: app.email,
        status: app.status,
        created_at: app.created_at,
      })) || [],
      timestamp: new Date().toISOString(),
      config: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

