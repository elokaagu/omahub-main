import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Function to get Supabase client
const getSupabaseClient = async () => {
  const cookieStore = cookies();

  console.log("Initializing Supabase client with URL:", supabaseUrl);

  if (!supabaseServiceKey) {
    console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is not defined");
  }

  // Use service role key for API operations
  return createClient(supabaseUrl, supabaseServiceKey);
};

// POST endpoint to add a new review
export async function POST(request) {
  console.log("POST /api/reviews received");
  try {
    const supabase = await getSupabaseClient();
    const body = await request.json();
    console.log("Review submission data:", body);

    const {
      userId,
      brandId,
      author,
      comment,
      rating,
      date = new Date().toISOString().split("T")[0],
    } = body;

    // Validate required fields
    if (!brandId || !author || !comment || !rating) {
      console.error("Missing required fields:", {
        brandId,
        author,
        comment,
        rating,
      });
      return NextResponse.json(
        { error: "Brand ID, author, comment, and rating are required" },
        { status: 400 }
      );
    }

    console.log(`Adding review for brand ${brandId} by ${author}`);

    // Add review
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        brand_id: brandId,
        author,
        comment,
        rating: parseFloat(rating),
        date,
        user_id: userId || null, // Make user_id optional
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding review:", error);
      return NextResponse.json(
        { error: "Failed to add review", details: error.message },
        { status: 500 }
      );
    }

    console.log("Review added successfully:", data);

    // Update the brand's average rating
    await updateBrandRating(supabase, brandId);

    return NextResponse.json({
      success: true,
      message: "Review added successfully",
      review: data,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve reviews for a brand
export async function GET(request) {
  console.log("GET /api/reviews received");
  try {
    const supabase = await getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    console.log("Fetching reviews for brandId:", brandId);

    if (!brandId) {
      console.error("Brand ID is required");
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    // Get reviews for the brand, ordered by most recent
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error fetching reviews for brand ${brandId}:`, error);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    console.log(`Found ${data?.length || 0} reviews for brand ${brandId}`);
    return NextResponse.json({ reviews: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Helper function to update brand's average rating
async function updateBrandRating(supabase, brandId) {
  console.log(`Updating average rating for brand ${brandId}`);

  // Get all ratings for the brand
  const { data: reviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("rating")
    .eq("brand_id", brandId);

  if (reviewsError) {
    console.error(`Error fetching ratings for brand ${brandId}:`, reviewsError);
    return;
  }

  if (!reviews || reviews.length === 0) {
    console.log(
      `No reviews found for brand ${brandId}, skipping rating update`
    );
    return;
  }

  // Calculate average rating
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const avgRating = sum / reviews.length;
  const roundedRating = Math.round(avgRating * 10) / 10; // Round to 1 decimal place

  console.log(
    `New average rating for brand ${brandId}: ${roundedRating} (from ${reviews.length} reviews)`
  );

  // Update brand's rating
  const { error: updateError } = await supabase
    .from("brands")
    .update({ rating: roundedRating })
    .eq("id", brandId);

  if (updateError) {
    console.error(`Error updating brand rating for ${brandId}:`, updateError);
  } else {
    console.log(`Successfully updated rating for brand ${brandId}`);
  }
}
