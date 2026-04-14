import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Failed to fetch profile for portfolio access", profileError.code);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    const role = profile?.role;
    const ownedBrands = Array.isArray(profile?.owned_brands)
      ? profile.owned_brands
      : [];
    if (!["super_admin", "brand_admin"].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (role === "brand_admin" && ownedBrands.length === 0) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const limitRaw = Number.parseInt(searchParams.get("limit") || "50", 10);
    const pageRaw = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(200, Math.max(1, limitRaw))
      : 50;
    const page = Number.isFinite(pageRaw) ? Math.max(1, pageRaw) : 1;
    const offset = (page - 1) * limit;

    // Build query for portfolio items only
    let query = supabase
      .from("products")
      .select(
        `
        id,
        title,
        slug,
        description,
        image,
        images,
        brand_id,
        service_type,
        price,
        currency,
        created_at,
        updated_at,
        brand:brands(id, name, category, location)
      `
      )
      .eq("service_type", "portfolio")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // If not super admin, filter by owned brands
    if (role === "brand_admin") {
      query = query.in("brand_id", ownedBrands);
    }

    const { data: portfolioItems, error } = await query;

    if (error) {
      console.error("Error fetching portfolio items:", error);
      return NextResponse.json(
        { error: "Failed to fetch portfolio items" },
        { status: 500 }
      );
    }

    // Ensure portfolio items have correct image structure
    const normalizedPortfolioItems = (portfolioItems || []).map((item) => {
      // For portfolio items, ensure the first image from images array is always the main image
      if (item.images && item.images.length > 0) {
        const firstImage = item.images[0];
        if (firstImage && firstImage !== item.image) {
          return {
            ...item,
            image: firstImage,
          };
        }
      }
      return item;
    });

    return NextResponse.json(normalizedPortfolioItems);
  } catch (error) {
    console.error("Portfolio API error:", error instanceof Error ? error.name : "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
