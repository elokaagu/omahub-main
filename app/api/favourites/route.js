import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Initialize Supabase client with proper environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Function to get Supabase client with user context
const getSupabaseClient = () => {
  // Use service role key for API operations if available, fallback to anon key
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Required Supabase environment variables are missing");
    throw new Error("Supabase configuration is missing");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// GET endpoint to retrieve user favourites
export async function GET(request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user favourites
    const { data, error } = await supabase
      .from("favourites")
      .select("brand_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching favourites:", error);
      return NextResponse.json(
        { error: "Failed to fetch favourites" },
        { status: 500 }
      );
    }

    // If no favourites, return empty array
    if (!data || data.length === 0) {
      return NextResponse.json({ favourites: [] });
    }

    // Extract brand IDs
    const brandIds = data.map((favourite) => favourite.brand_id);

    // Get full brand details for each favourite
    const { data: brandsData, error: brandsError } = await supabase
      .from("brands")
      .select("*")
      .in("id", brandIds);

    if (brandsError) {
      console.error("Error fetching favourite brands:", brandsError);
      return NextResponse.json(
        { error: "Failed to fetch favourite brands" },
        { status: 500 }
      );
    }

    return NextResponse.json({ favourites: brandsData || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST endpoint to add a favourite
export async function POST(request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { userId, brandId } = body;

    if (!userId || !brandId) {
      return NextResponse.json(
        { error: "User ID and Brand ID are required" },
        { status: 400 }
      );
    }

    // Check if favourite already exists
    const { data: existingFavourite, error: checkError } = await supabase
      .from("favourites")
      .select("*")
      .eq("user_id", userId)
      .eq("brand_id", brandId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "Results contain 0 rows" - that's expected
      console.error("Error checking favourite:", checkError);
      return NextResponse.json(
        { error: "Failed to check if favourite exists" },
        { status: 500 }
      );
    }

    // If favourite already exists, return success
    if (existingFavourite) {
      return NextResponse.json({
        success: true,
        message: "Already favourited",
      });
    }

    // Add favourite
    const { error } = await supabase.from("favourites").insert({
      user_id: userId,
      brand_id: brandId,
    });

    if (error) {
      console.error("Error adding favourite:", error);
      return NextResponse.json(
        { error: "Failed to add favourite" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Favourite added successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a favourite
export async function DELETE(request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const brandId = searchParams.get("brandId");

    if (!userId || !brandId) {
      return NextResponse.json(
        { error: "User ID and Brand ID are required" },
        { status: 400 }
      );
    }

    // Remove favourite
    const { error } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", userId)
      .eq("brand_id", brandId);

    if (error) {
      console.error("Error removing favourite:", error);
      return NextResponse.json(
        { error: "Failed to remove favourite" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Favourite removed successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
