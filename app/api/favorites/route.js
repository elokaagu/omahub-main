import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Function to get Supabase client with user context
const getSupabaseClient = async () => {
  const cookieStore = cookies();
  const supabaseAuthCookie = cookieStore.get("supabase-auth-token");

  // Use service role key for API operations
  return createClient(supabaseUrl, supabaseServiceKey);
};

// GET endpoint to retrieve user favorites
export async function GET(request) {
  try {
    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user favorites
    const { data, error } = await supabase
      .from("favorites")
      .select("brand_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching favorites:", error);
      return NextResponse.json(
        { error: "Failed to fetch favorites" },
        { status: 500 }
      );
    }

    // If no favorites, return empty array
    if (!data || data.length === 0) {
      return NextResponse.json({ favorites: [] });
    }

    // Extract brand IDs
    const brandIds = data.map((favorite) => favorite.brand_id);

    // Get full brand details for each favorite
    const { data: brandsData, error: brandsError } = await supabase
      .from("brands")
      .select("*")
      .in("id", brandIds);

    if (brandsError) {
      console.error("Error fetching favorite brands:", brandsError);
      return NextResponse.json(
        { error: "Failed to fetch favorite brands" },
        { status: 500 }
      );
    }

    return NextResponse.json({ favorites: brandsData || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST endpoint to add a favorite
export async function POST(request) {
  try {
    const supabase = await getSupabaseClient();
    const body = await request.json();
    const { userId, brandId } = body;

    if (!userId || !brandId) {
      return NextResponse.json(
        { error: "User ID and Brand ID are required" },
        { status: 400 }
      );
    }

    // Check if favorite already exists
    const { data: existingFavorite, error: checkError } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", userId)
      .eq("brand_id", brandId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "Results contain 0 rows" - that's expected
      console.error("Error checking favorite:", checkError);
      return NextResponse.json(
        { error: "Failed to check if favorite exists" },
        { status: 500 }
      );
    }

    // If favorite already exists, return success
    if (existingFavorite) {
      return NextResponse.json({ success: true, message: "Already favorited" });
    }

    // Add favorite
    const { error } = await supabase.from("favorites").insert({
      user_id: userId,
      brand_id: brandId,
    });

    if (error) {
      console.error("Error adding favorite:", error);
      return NextResponse.json(
        { error: "Failed to add favorite" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Favorite added successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a favorite
export async function DELETE(request) {
  try {
    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const brandId = searchParams.get("brandId");

    if (!userId || !brandId) {
      return NextResponse.json(
        { error: "User ID and Brand ID are required" },
        { status: 400 }
      );
    }

    // Remove favorite
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("brand_id", brandId);

    if (error) {
      console.error("Error removing favorite:", error);
      return NextResponse.json(
        { error: "Failed to remove favorite" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Favorite removed successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
