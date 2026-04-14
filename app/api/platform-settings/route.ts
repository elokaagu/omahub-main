import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { parsePlatformSettingsUpdate } from "@/lib/validation/platformSettingsBody";

const SETTING_KEYS = ["about_omahub", "our_story", "tailored_services"] as const;

const MAP_DB_TO_API: Record<(typeof SETTING_KEYS)[number], "about" | "ourStory" | "tailoredServices"> = {
  about_omahub: "about",
  our_story: "ourStory",
  tailored_services: "tailoredServices",
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", [...SETTING_KEYS]);

    if (error) {
      console.error("platform_settings_get_failed", error.message);
      return NextResponse.json(
        { error: "Failed to fetch platform settings" },
        { status: 500 }
      );
    }

    const response = {
      about: "",
      ourStory: "",
      tailoredServices: "",
    };

    for (const row of data ?? []) {
      const key = row.key as (typeof SETTING_KEYS)[number];
      const apiKey = MAP_DB_TO_API[key];
      if (!apiKey) continue;
      response[apiKey] = typeof row.value === "string" ? row.value : "";
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error(
      "platform_settings_get_exception",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json(
      { error: "Failed to fetch platform settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = parsePlatformSettingsUpdate(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid settings payload" },
        { status: 400 }
      );
    }

    const { about, ourStory, tailoredServices } = parsed.data;
    const now = new Date().toISOString();

    const updates = [] as Array<{ key: string; value: string; updated_at: string }>;

    if (about !== undefined) {
      updates.push({ key: "about_omahub", value: about, updated_at: now });
    }
    if (ourStory !== undefined) {
      updates.push({ key: "our_story", value: ourStory, updated_at: now });
    }
    if (tailoredServices !== undefined) {
      updates.push({ key: "tailored_services", value: tailoredServices, updated_at: now });
    }

    const { error: upsertError } = await supabase
      .from("platform_settings")
      .upsert(updates, { onConflict: "key" });

    if (upsertError) {
      console.error("platform_settings_upsert_failed", upsertError.message);
      return NextResponse.json(
        { error: "Failed to update platform settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(
      "platform_settings_post_exception",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json(
      { error: "Failed to update platform settings" },
      { status: 500 }
    );
  }
}
