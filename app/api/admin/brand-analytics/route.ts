import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-unified";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 BRAND ANALYTICS API: Starting request");

    const supabase = createClient();

    // Get user from session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("🔍 BRAND ANALYTICS API: Session check", {
      hasSession: !!session,
      sessionError: sessionError?.message,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });

    if (sessionError || !session?.user) {
      console.log("❌ BRAND ANALYTICS API: Unauthorized - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const { searchParams } = new URL(request.url);
    const brandIdsParam = searchParams.get("brand_ids");

    console.log("🔍 BRAND ANALYTICS API: Request params", {
      brandIdsParam,
      userId: user.id,
      userEmail: user.email,
    });

    if (!brandIdsParam) {
      console.log("❌ BRAND ANALYTICS API: Missing brand_ids parameter");
      return NextResponse.json(
        { error: "Brand IDs required" },
        { status: 400 }
      );
    }

    const brandIds = brandIdsParam.split(",");
    console.log("🔍 BRAND ANALYTICS API: Parsed brand IDs", brandIds);

    // Verify user has access to these brands
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, owned_brands")
      .eq("id", user.id)
      .single();

    console.log("🔍 BRAND ANALYTICS API: Profile check", {
      profile: profile
        ? {
            role: profile.role,
            owned_brands: profile.owned_brands,
          }
        : null,
      profileError: profileError?.message,
    });

    if (profileError) {
      console.log("❌ BRAND ANALYTICS API: Profile fetch error", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile?.role === "brand_admin") {
      const userOwnedBrands = profile.owned_brands || [];
      const hasAccess = brandIds.every((brandId) =>
        userOwnedBrands.includes(brandId)
      );

      console.log("🔍 BRAND ANALYTICS API: Brand admin access check", {
        requestedBrands: brandIds,
        userOwnedBrands,
        hasAccess,
      });

      if (!hasAccess) {
        console.log(
          "❌ BRAND ANALYTICS API: Access denied - brand ownership mismatch"
        );
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (profile?.role !== "super_admin") {
      console.log("❌ BRAND ANALYTICS API: Insufficient permissions", {
        userRole: profile?.role,
      });
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    console.log("✅ BRAND ANALYTICS API: Access granted, fetching data");

    // Get analytics data
    const [brandsResult, productsResult, reviewsResult, recentReviewsResult] =
      await Promise.all([
        supabase
          .from("brands")
          .select("id", { count: "exact" })
          .in("id", brandIds),
        supabase
          .from("products")
          .select("id", { count: "exact" })
          .in("brand_id", brandIds),
        supabase.from("reviews").select("rating").in("brand_id", brandIds),
        supabase
          .from("reviews")
          .select("id", { count: "exact" })
          .in("brand_id", brandIds)
          .gte(
            "created_at",
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).toISOString()
          ),
      ]);

    const totalBrands = brandsResult.count || 0;
    const totalProducts = productsResult.count || 0;
    const allReviews = reviewsResult.data || [];
    const totalReviews = allReviews.length;
    const recentReviews = recentReviewsResult.count || 0;

    let averageRating = 0;
    if (totalReviews > 0) {
      const totalRating = allReviews.reduce(
        (sum, review) => sum + (review.rating || 0),
        0
      );
      averageRating = totalRating / totalReviews;
    }

    const analytics = {
      totalBrands,
      totalProducts,
      totalReviews,
      averageRating,
      recentReviews,
    };

    console.log(`📊 Brand Analytics for ${brandIds.join(", ")}:`, analytics);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Brand analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
