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
    console.error("NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!supabaseAnonKey);
    console.error("SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
    throw new Error("Supabase configuration is missing");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Function to get authenticated user from cookies
const getAuthenticatedUser = async () => {
  try {
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
};

// GET endpoint to retrieve user favourites
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const userId = user.id;

    // Get user favourites
    const { data, error } = await supabase
      .from("favourites")
      .select("*")
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

    // Group favourites by type
    const brandFavourites = data.filter((f) => f.item_type === "brand");
    const catalogueFavourites = data.filter((f) => f.item_type === "catalogue");
    const productFavourites = data.filter((f) => f.item_type === "product");

    // Fetch details for each type
    const [brandsData, cataloguesData, productsData] = await Promise.all([
      // Fetch brands
      brandFavourites.length > 0
        ? supabase
            .from("brands")
            .select("*")
            .in(
              "id",
              brandFavourites.map((f) => f.item_id)
            )
            .then(({ data }) => data || [])
        : [],
      // Fetch catalogues
      catalogueFavourites.length > 0
        ? supabase
            .from("catalogues")
            .select("*")
            .in(
              "id",
              catalogueFavourites.map((f) => f.item_id)
            )
            .then(({ data }) => data || [])
        : [],
      // Fetch products
      productFavourites.length > 0
        ? supabase
            .from("products")
            .select("*")
            .in(
              "id",
              productFavourites.map((f) => f.item_id)
            )
            .then(({ data }) => data || [])
        : [],
    ]);

    // Combine all favourites with their item_type information
    const favourites = [
      ...brandsData.map((brand) => ({ ...brand, item_type: "brand" })),
      ...cataloguesData.map((catalogue) => ({
        ...catalogue,
        item_type: "catalogue",
      })),
      ...productsData.map((product) => ({ ...product, item_type: "product" })),
    ];

    return NextResponse.json({ favourites });
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
    console.log("🔍 POST /api/favourites - Starting request processing");

    let supabase;
    try {
      supabase = getSupabaseClient();
      console.log("✅ Supabase client created successfully");
    } catch (clientError) {
      console.error("❌ Failed to create Supabase client:", clientError);
      return NextResponse.json(
        { error: "Database configuration error" },
        { status: 500 }
      );
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { itemId, itemType } = body;
    const userId = user.id;

    // Add debugging
    console.log("🔍 POST /api/favourites received:", {
      userId,
      itemId,
      itemType,
      userIdType: typeof userId,
      userIdLength: userId?.length,
    });

    if (!itemId || !itemType) {
      console.log("❌ Missing required fields:", { itemId, itemType });
      return NextResponse.json(
        { error: "Item ID and Item Type are required" },
        { status: 400 }
      );
    }

    // Validate item type
    if (!["brand", "catalogue", "product"].includes(itemType)) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }

    // Check if favourite already exists
    console.log("🔄 Checking if favourite already exists...");
    const { data: existingFavourite, error: checkError } = await supabase
      .from("favourites")
      .select("*")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .eq("item_type", itemType)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "Results contain 0 rows" - that's expected
      console.error("❌ Error checking favourite:", checkError);
      return NextResponse.json(
        {
          error: "Failed to check if favourite exists",
          details: checkError.message,
        },
        { status: 500 }
      );
    }

    // If favourite already exists, return success
    if (existingFavourite) {
      console.log("✅ Favourite already exists");
      return NextResponse.json({
        success: true,
        message: "Already favourited",
      });
    }

    // Add favourite
    console.log("🔄 Attempting to insert favourite...");
    const { error } = await supabase.from("favourites").insert({
      user_id: userId,
      item_id: itemId,
      item_type: itemType,
    });

    if (error) {
      console.error("❌ Error adding favourite:", error);
      return NextResponse.json(
        { error: "Failed to add favourite", details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Favourite added successfully");
    return NextResponse.json({
      success: true,
      message: "Favourite added successfully",
    });
  } catch (error) {
    console.error("❌ Unexpected error in POST /api/favourites:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a favourite
export async function DELETE(request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = user.id;
    const itemId = searchParams.get("itemId");
    const itemType = searchParams.get("itemType");

    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: "Item ID and Item Type are required" },
        { status: 400 }
      );
    }

    // Validate item type
    if (!["brand", "catalogue", "product"].includes(itemType)) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }

    // Remove favourite
    const { error } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .eq("item_type", itemType);

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
