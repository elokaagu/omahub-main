import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;

    // Force fresh data with cache control
    const { data: favourites, error: favouritesError } = await supabase
      .from("favourites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (favouritesError) {
      console.error("Error fetching favourites:", favouritesError);
      return NextResponse.json(
        { error: "Failed to fetch favourites" },
        { status: 500 }
      );
    }

    // Enrich favourites with item data
    const enrichedFavourites = [];
    for (const favourite of favourites || []) {
      try {
        let itemData = null;
        switch (favourite.item_type) {
          case "brand":
            const { data: brand } = await supabase
              .from("brands")
              .select(
                "id, name, image, category, location, is_verified, rating"
              )
              .eq("id", favourite.item_id)
              .single();
            if (brand) {
              itemData = {
                ...brand,
                item_type: "brand",
                favourite_id: favourite.id,
              };
            }
            break;
          case "catalogue":
            const { data: catalogue } = await supabase
              .from("catalogues")
              .select("id, title, image, brand_id, description")
              .eq("id", favourite.item_id)
              .single();
            if (catalogue) {
              itemData = {
                ...catalogue,
                item_type: "catalogue",
                favourite_id: favourite.id,
              };
            }
            break;
          case "product":
            const { data: product } = await supabase
              .from("products")
              .select(
                `id, title, image, brand_id, price, sale_price, category, brand:brands(id, name, location, price_range, currency)`
              )
              .eq("id", favourite.item_id)
              .single();
            if (product) {
              itemData = {
                ...product,
                item_type: "product",
                favourite_id: favourite.id,
                price: product.sale_price || product.price,
                brand: product.brand,
              };
            }
            break;
        }
        if (itemData) {
          enrichedFavourites.push(itemData);
        }
      } catch (itemError) {
        console.error(`Error fetching item ${favourite.item_id}:`, itemError);
      }
    }

    const brands = enrichedFavourites.filter(
      (item: any) => item.name && !item.brand_id && !item.price
    );
    const collections = enrichedFavourites.filter(
      (item: any) => item.title && item.brand_id && !item.price
    );
    const products = enrichedFavourites.filter(
      (item: any) => item.title && item.price
    );

    return NextResponse.json(
      {
        user: { id: userId },
        favourites: {
          total: enrichedFavourites.length,
          brands: brands.length,
          collections: collections.length,
          products: products.length,
          items: enrichedFavourites,
        },
        summary: { brands, collections, products },
        metadata: {
          fetched_at: new Date().toISOString(),
          timestamp: Date.now(),
          cache_control: "no-cache, no-store, must-revalidate",
        },
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "X-Fetched-At": new Date().toISOString(),
        },
      }
    );
  } catch (error) {
    console.error("Error in favourites API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    
    // Handle both parameter naming conventions for backward compatibility
    const item_id = body.item_id || body.itemId;
    const item_type = body.item_type || body.itemType;

    if (!item_id || !item_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if already favourited
    const { data: existingFavourite } = await supabase
      .from("favourites")
      .select("id")
      .eq("user_id", userId)
      .eq("item_id", item_id)
      .eq("item_type", item_type)
      .single();

    if (existingFavourite) {
      return NextResponse.json(
        { error: "Already favourited" },
        { status: 400 }
      );
    }

    // Get item name for the favourite
    let itemName = "Unknown";
    try {
      switch (item_type) {
        case "brand":
          const { data: brand } = await supabase
            .from("brands")
            .select("name")
            .eq("id", item_id)
            .single();
          itemName = brand?.name || "Unknown Brand";
          break;
        case "catalogue":
          const { data: catalogue } = await supabase
            .from("catalogues")
            .select("title")
            .eq("id", item_id)
            .single();
          itemName = catalogue?.title || "Unknown Collection";
          break;
        case "product":
          const { data: product } = await supabase
            .from("products")
            .select("title")
            .eq("id", item_id)
            .single();
          itemName = product?.title || "Unknown Product";
          break;
      }
    } catch (nameError) {
      console.error("Error fetching item name:", nameError);
    }

    // Insert new favourite
    const { data: favourite, error: insertError } = await supabase
      .from("favourites")
      .insert({
        user_id: userId,
        item_id,
        item_type,
        name: itemName,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting favourite:", insertError);
      return NextResponse.json(
        { error: "Failed to add favourite" },
        { status: 500 }
      );
    }

    // Force database refresh by querying immediately
    try {
      await supabase.rpc("refresh_favourites_cache", { user_id: userId });
    } catch (rpcError) {
      // Ignore if RPC doesn't exist
      console.log("RPC refresh_favourites_cache not available, continuing...");
    }

    return NextResponse.json(
      {
        success: true,
        favourite,
        message: "Added to favourites",
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Updated-At": new Date().toISOString(),
        },
      }
    );
  } catch (error) {
    console.error("Error in favourites POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 400 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const item_id = searchParams.get("itemId") || searchParams.get("item_id");
    const item_type =
      searchParams.get("itemType") || searchParams.get("item_type");

    if (!item_id || !item_type) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Delete favourite
    const { error: deleteError } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", item_id)
      .eq("item_type", item_type);

    if (deleteError) {
      console.error("Error deleting favourite:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove favourite" },
        { status: 500 }
      );
    }

    // Force database refresh
    try {
      await supabase.rpc("refresh_favourites_cache", { user_id: userId });
    } catch (rpcError) {
      // Ignore if RPC doesn't exist
      console.log("RPC refresh_favourites_cache not available, continuing...");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Removed from favourites",
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Updated-At": new Date().toISOString(),
        },
      }
    );
  } catch (error) {
    console.error("Error in favourites DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
