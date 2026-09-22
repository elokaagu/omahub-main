import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import {
  PLATFORM_VISIBILITY_EFFECTIVE_WHEN_MISSING,
  readPlatformVisibility,
} from "@/lib/studio/platformSettings";

export const dynamic = "force-dynamic";

/** Super-admin only: current platform_visibility (public vs private). */
export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let visibility;
    try {
      visibility = await readPlatformVisibility(auth.supabase);
    } catch {
      return NextResponse.json(
        { error: "Failed to read platform status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...visibility,
      effectiveWhenMissing: PLATFORM_VISIBILITY_EFFECTIVE_WHEN_MISSING,
    });
  } catch (error) {
    console.error("Platform status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
