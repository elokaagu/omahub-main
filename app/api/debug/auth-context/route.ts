import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/supabase";

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    console.log("🔍 Auth Context Debug: Starting...");

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.log("❌ Session Error:", sessionError);
      return NextResponse.json(
        {
          error: "Session error",
          details: sessionError,
        },
        { status: 401 }
      );
    }

    if (!session) {
      console.log("❌ No session found");
      return NextResponse.json(
        {
          error: "No session",
        },
        { status: 401 }
      );
    }

    console.log("✅ Session found:", {
      userId: session.user.id,
      email: session.user.email,
    });

    // Get the profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      console.log("❌ Profile Error:", profileError);
      return NextResponse.json(
        {
          error: "Profile error",
          details: profileError,
          session: {
            userId: session.user.id,
            email: session.user.email,
          },
        },
        { status: 500 }
      );
    }

    console.log("✅ Profile found:", profile);

    // Test catalogues access
    const { data: catalogues, error: cataloguesError } = await supabase.from(
      "catalogues"
    ).select(`
        *,
        brand:brands(id, name, location, is_verified, category)
      `);

    if (cataloguesError) {
      console.log("❌ Catalogues Error:", cataloguesError);
    } else {
      console.log(`✅ Catalogues found: ${catalogues.length}`);

      const userCatalogues = catalogues.filter((c) =>
        profile.owned_brands?.includes(c.brand_id)
      );
      console.log(`✅ User's catalogues: ${userCatalogues.length}`);
    }

    return NextResponse.json({
      success: true,
      session: {
        userId: session.user.id,
        email: session.user.email,
      },
      profile: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        owned_brands: profile.owned_brands,
      },
      catalogues: {
        total: catalogues?.length || 0,
        userCatalogues:
          catalogues?.filter((c) => profile.owned_brands?.includes(c.brand_id))
            .length || 0,
        userCataloguesList:
          catalogues
            ?.filter((c) => profile.owned_brands?.includes(c.brand_id))
            .map((c) => ({
              id: c.id,
              title: c.title,
              brand_id: c.brand_id,
              brand_name: c.brand?.name,
            })) || [],
      },
    });
  } catch (error) {
    console.error("❌ Debug endpoint error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
