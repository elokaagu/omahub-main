import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

// GET - Fetch user's favourites
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.log("No valid session found");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    console.log("Fetching favourites for user:", session.user.id);

    // Fetch user's favourites
    const { data: favourites, error: favouritesError } = await supabase
      .from("favourites")
      .select("*")
      .eq("user_id", session.user.id);

    if (favouritesError) {
      console.error("Error fetching favourites:", favouritesError);
      return NextResponse.json({ error: "Failed to fetch favourites" }, { status: 500 });
    }

    // Enrich favourites with actual item data
    const enrichedFavourites = [];
    
    for (const favourite of favourites || []) {
      try {
        let itemData = null;
        
        switch (favourite.item_type) {
          case "brand":
            const { data: brand } = await supabase
              .from("brands")
              .select("id, name, image, category, location, is_verified, rating")
              .eq("id", favourite.item_id)
              .single();
            if (brand) {
              itemData = { ...brand, item_type: "brand", favourite_id: favourite.id };
            }
            break;
            
          case "catalogue":
            const { data: catalogue } = await supabase
              .from("catalogues")
              .select("id, title, image, brand_id, description")
              .eq("id", favourite.item_id)
              .single();
            if (catalogue) {
              itemData = { ...catalogue, item_type: "catalogue", favourite_id: favourite.id };
            }
            break;
            
          case "product":
            const { data: product } = await supabase
              .from("products")
              .select(`
                id, title, image, brand_id, price, sale_price, category,
                brand:brands(id, name, location, price_range, currency)
              `)
              .eq("id", favourite.item_id)
              .single();
            if (product) {
              itemData = { 
                ...product, 
                item_type: "product", 
                favourite_id: favourite.id,
                price: product.sale_price || product.price,
                brand: product.brand
              };
            }
            break;
        }
        
        if (itemData) {
          enrichedFavourites.push(itemData);
        }
      } catch (itemError) {
        console.error(`Error fetching item ${favourite.item_id}:`, itemError);
        // Continue with other items
      }
    }

    return NextResponse.json({
      favourites: enrichedFavourites,
      user: { id: session.user.id, email: session.user.email }
    });
    
  } catch (error) {
    console.error("Favourites API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add item to favourites
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.log("No valid session found");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { itemId, itemType } = await request.json();
    
    if (!itemId || !itemType) {
      return NextResponse.json({ error: "Item ID and type are required" }, { status: 400 });
    }

    console.log("Adding favourite:", { itemId, itemType, userId: session.user.id });

    // Check if already favourited
    const { data: existingFavourite } = await supabase
      .from("favourites")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("item_id", itemId)
      .eq("item_type", itemType)
      .single();

    if (existingFavourite) {
      return NextResponse.json({ error: "Item already in favourites" }, { status: 400 });
    }

    // Add to favourites
    const { data: newFavourite, error: insertError } = await supabase
      .from("favourites")
      .insert({
        user_id: session.user.id,
        item_id: itemId,
        item_type: itemType
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error adding favourite:", insertError);
      return NextResponse.json({ error: "Failed to add to favourites" }, { status: 500 });
    }

    console.log("Favourite added successfully:", newFavourite);

    return NextResponse.json({
      message: "Added to favourites",
      favourite: newFavourite,
      user: { id: session.user.id, email: session.user.email }
    });
    
  } catch (error) {
    console.error("Favourites API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove item from favourites
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.log("No valid session found");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const itemType = searchParams.get("itemType");
    
    if (!itemId || !itemType) {
      return NextResponse.json({ error: "Item ID and type are required" }, { status: 400 });
    }

    console.log("Removing favourite:", { itemId, itemType, userId: session.user.id });

    // Remove from favourites
    const { error: deleteError } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", session.user.id)
      .eq("item_id", itemId)
      .eq("item_type", itemType);

    if (deleteError) {
      console.error("Error removing favourite:", deleteError);
      return NextResponse.json({ error: "Failed to remove from favourites" }, { status: 500 });
    }

    console.log("Favourite removed successfully");

    return NextResponse.json({
      message: "Removed from favourites",
      user: { id: session.user.id, email: session.user.email }
    });
    
  } catch (error) {
    console.error("Favourites API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
