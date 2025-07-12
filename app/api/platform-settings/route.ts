import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/services/authService";

// GET: Fetch About Us and Our Story text
export async function GET() {
  try {
    const { data: aboutData, error: aboutError } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "about_omahub")
      .single();
    const { data: storyData, error: storyError } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "our_story")
      .single();
    if (aboutError && aboutError.code !== "PGRST116") {
      return NextResponse.json({ error: aboutError.message }, { status: 500 });
    }
    if (storyError && storyError.code !== "PGRST116") {
      return NextResponse.json({ error: storyError.message }, { status: 500 });
    }
    return NextResponse.json({
      about: aboutData?.value || "",
      ourStory: storyData?.value || "",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch About Us and Our Story text" },
      { status: 500 }
    );
  }
}

// POST: Update About Us and/or Our Story text (super admin only)
export async function POST(req: NextRequest) {
  try {
    const { user, about, ourStory } = await req.json();
    const profile = await getProfile(user?.id);
    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }
    const updates = [];
    if (about !== undefined) {
      updates.push({
        key: "about_omahub",
        value: about,
        updated_at: new Date().toISOString(),
      });
    }
    if (ourStory !== undefined) {
      updates.push({
        key: "our_story",
        value: ourStory,
        updated_at: new Date().toISOString(),
      });
    }
    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }
    const { error } = await supabase
      .from("platform_settings")
      .upsert(updates, { onConflict: "key" });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update About Us or Our Story text" },
      { status: 500 }
    );
  }
}
