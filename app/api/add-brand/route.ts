import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { getAdminClient } from "@/lib/supabase-admin";
import { getProfile } from "@/lib/services/authService";
import { EBHS_COUTURE_BRAND_UPSERT } from "@/lib/seed/ebhs-couture-brand";

export const dynamic = "force-dynamic";

/** Legacy misuse: mutations must not use GET (crawlers, prefetch). */
export async function GET() {
  return NextResponse.json(
    {
      error:
        "Method not allowed. Use POST with an authenticated super-admin session.",
    },
    { status: 405, headers: { Allow: "POST" } }
  );
}

/**
 * Idempotent upsert of the Ebhs Couture seed brand (super-admin only).
 * Not a general-purpose brand API — see studio/admin flows for that.
 */
export async function POST() {
  try {
    const sessionClient = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getProfile(user.id);
    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const supabase = await getAdminClient();
    if (!supabase) {
      console.error("[api/add-brand] Admin client unavailable");
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    const payload = {
      ...EBHS_COUTURE_BRAND_UPSERT,
    } as Record<string, unknown>;

    const { data, error } = await supabase
      .from("brands")
      .upsert(payload, { onConflict: "id" })
      .select("id, name")
      .single();

    if (error) {
      console.error("[api/add-brand] Upsert failed", {
        route: "POST /api/add-brand",
        brandId: EBHS_COUTURE_BRAND_UPSERT.id,
        code: error.code,
      });
      return NextResponse.json(
        { error: "Failed to save brand" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Brand saved successfully",
        brand: data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[api/add-brand] Unexpected error", {
      route: "POST /api/add-brand",
      err,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
