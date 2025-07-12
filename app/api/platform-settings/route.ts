import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/services/authService";

// GET: Fetch About Us text
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "about_omahub")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ about: data?.value || "" });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch About Us text" },
      { status: 500 }
    );
  }
}

// POST: Update About Us text (super admin only)
export async function POST(req: NextRequest) {
  try {
    const { user } = await req.json();
    const profile = await getProfile(user?.id);
    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    const { about } = await req.json();
    const { error } = await supabase
      .from("platform_settings")
      .upsert(
        {
          key: "about_omahub",
          value: about,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update About Us text" },
      { status: 500 }
    );
  }
}
