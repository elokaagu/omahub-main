import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";
import { setPlatformVisibility } from "@/lib/services/platformVisibilityControl";
import { requireEmptyOrEmptyObjectBody } from "@/lib/validation/passwordGatePostBody";

export const dynamic = "force-dynamic";

/**
 * Super-admin only. Sets `platform_settings.platform_visibility` to `public`
 * (password gate off). Authoritative state lives in the database; the
 * `omahub-public` cookie is a secondary hint for legacy middleware/clients only.
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
      "public",
      auth.userId,
      "disable_password_gate"
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
      message: result.changed
        ? "Password gate disabled. Platform is now public."
        : "Platform visibility was already public.",
      previousValue: result.previousValue,
      newValue: result.newValue,
      changed: result.changed,
    });

    // Secondary to DB — keep middleware/legacy paths in sync after successful write.
    response.cookies.set("omahub-public", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "remove_password_gate_unexpected",
        message: error instanceof Error ? error.message : String(error),
      })
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
