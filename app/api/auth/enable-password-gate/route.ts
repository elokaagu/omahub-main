import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { setPlatformVisibility } from "@/lib/services/platformVisibilityControl";
import { requireEmptyOrEmptyObjectBody } from "@/lib/validation/passwordGatePostBody";

export const dynamic = "force-dynamic";

/**
 * Super-admin only. Sets `platform_settings.platform_visibility` to `private`
 * (password gate on). DB is source of truth; clearing `omahub-public` is a
 * secondary hint for legacy middleware/clients. No email-based privilege fallback.
 */
export async function POST(request: NextRequest) {
  try {
    const bodyError = await requireEmptyOrEmptyObjectBody(request);
    if (bodyError) {
      return bodyError;
    }

    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const result = await setPlatformVisibility(
      auth.supabase,
      "private",
      auth.userId,
      "enable_password_gate"
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
      message: result.changed
        ? "Password gate enabled. Platform is now private."
        : "Platform visibility was already private.",
      previousValue: result.previousValue,
      newValue: result.newValue,
      changed: result.changed,
    });

    // Secondary to DB — invalidate legacy public hint after successful write.
    response.cookies.set("omahub-public", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "enable_password_gate_unexpected",
        message: error instanceof Error ? error.message : String(error),
      })
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
