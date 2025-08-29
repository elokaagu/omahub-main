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
    const { data: applications, error } = await supabase
      .from("designer_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching applications:", error);
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${applications?.length || 0} designer applications`);

    return NextResponse.json({
      applications: applications || [],
      count: applications?.length || 0
    });

  } catch (error) {
    console.error("💥 Error in applications API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
