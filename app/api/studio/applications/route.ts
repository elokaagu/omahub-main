import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getAdminClient();
    
    if (!supabase) {
      console.error("❌ Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Fetch all designer applications, ordered by creation date (newest first)
    // Note: We fetch all and sort in memory to handle NULL created_at values properly
    // Using admin client bypasses RLS, so we should get all applications
    const { data: applications, error } = await supabase
      .from("designer_applications")
      .select("*")
      .order("created_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("❌ Error fetching applications:", error);
      console.error("❌ Fetch error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { 
          error: "Failed to fetch applications",
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${applications?.length || 0} designer applications from database`);
    if (applications && applications.length > 0) {
      console.log("📋 All applications in database:", applications.map((app: any) => ({
        id: app.id,
        brand_name: app.brand_name,
        designer_name: app.designer_name,
        email: app.email,
        status: app.status,
        created_at: app.created_at,
        has_created_at: !!app.created_at,
        has_updated_at: !!app.updated_at,
      })));
      
      // Check for applications with missing required fields
      const incompleteApps = applications.filter((app: any) => 
        !app.created_at || !app.updated_at || !app.brand_name || !app.email
      );
      if (incompleteApps.length > 0) {
        console.warn("⚠️ Found applications with missing fields:", incompleteApps.map((app: any) => ({
          id: app.id,
          brand_name: app.brand_name,
          missing_fields: {
            created_at: !app.created_at,
            updated_at: !app.updated_at,
            brand_name: !app.brand_name,
            email: !app.email,
          }
        })));
      }
    }

    // Ensure all applications have required fields, fill in defaults if missing
    const normalizedApplications = (applications || []).map((app: any) => ({
      ...app,
      created_at: app.created_at || app.updated_at || new Date().toISOString(),
      updated_at: app.updated_at || app.created_at || new Date().toISOString(),
    }))
    // Sort by created_at (newest first), with fallback to updated_at, then id
    .sort((a: any, b: any) => {
      const aDate = a.created_at || a.updated_at || a.id;
      const bDate = b.created_at || b.updated_at || b.id;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    // Check if specific application ID exists (for debugging)
    const targetAppId = "3f0061c9-ae04-4661-a6fe-bb1d181f3e71";
    const targetApp = normalizedApplications.find((app: any) => app.id === targetAppId);
    if (targetApp) {
      console.log("✅ Found target application in results:", {
        id: targetApp.id,
        brand_name: targetApp.brand_name,
        status: targetApp.status,
        created_at: targetApp.created_at,
      });
    } else {
      console.warn("⚠️ Target application NOT found in results:", targetAppId);
      console.log("📋 All application IDs in results:", normalizedApplications.map((app: any) => app.id));
    }

    console.log(`📤 Returning ${normalizedApplications.length} normalized applications to frontend`);
    
    return NextResponse.json({
      applications: normalizedApplications,
      count: normalizedApplications.length,
      rawCount: applications?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("💥 Error in applications API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
