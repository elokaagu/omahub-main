import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import {
  PLATFORM_VISIBILITY_EFFECTIVE_WHEN_MISSING,
  PLATFORM_VISIBILITY_KEY,
} from "@/lib/services/platformVisibilityControl";

export const dynamic = "force-dynamic";

/** Super-admin only: current platform_visibility (public vs private). */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data: visData, error: visError } = await auth.supabase
      .from("platform_settings")
      .select("value")
      .eq("key", PLATFORM_VISIBILITY_KEY)
      .maybeSingle();

    if (visError) {
      console.error(
        JSON.stringify({
          event: "platform_status_read_failed",
          code: visError.code,
          message: visError.message,
        })
      );
      return NextResponse.json(
        { error: "Failed to read platform status" },
        { status: 500 }
      );
    }

    const settingPresent = visData != null;
    const storedValue =
      typeof visData?.value === "string" ? visData.value : null;
    const isRecognised =
      storedValue === "public" || storedValue === "private";

    // Only "public" is treated as public; missing row or anything else is non-public.
    const isPublic = storedValue === "public";
    const status = isPublic ? "public" : "private";

    const body: Record<string, unknown> = {
      success: true,
      isPublic,
      status,
      settingPresent,
      storedValue,
      effectiveWhenMissing: PLATFORM_VISIBILITY_EFFECTIVE_WHEN_MISSING,
    };

    if (!settingPresent) {
      body.fallback = "missing_row_defaults_to_private";
    } else if (storedValue != null && !isRecognised) {
      body.fallback = "unrecognised_stored_value_treated_as_private";
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error("Platform status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
