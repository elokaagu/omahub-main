import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";
import { normalizeProductImages } from "@/lib/utils/productImageUtils";

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
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    // Build query for portfolio items only
    let query = supabase
      .from("products")
      .select(
        `
        *,
        brand:brands(id, name, category, location)
      `
      )
      .eq("service_type", "portfolio")
      .order("created_at", { ascending: false });

    // If not super admin, filter by owned brands
    if (profile?.role !== "super_admin" && profile?.owned_brands) {
      query = query.in("brand_id", profile.owned_brands);
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
          console.log(
            `🔄 Normalizing portfolio item "${item.title}": updating main image from "${item.image}" to "${firstImage}"`
          );
          return {
            ...item,
            image: firstImage,
          };
        }
      }
      return item;
    });

    console.log(
      `📸 Fetched ${normalizedPortfolioItems.length} portfolio items with normalized images`
    );

    return NextResponse.json(normalizedPortfolioItems);
  } catch (error) {
    console.error("Portfolio API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
