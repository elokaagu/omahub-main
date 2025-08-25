import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET - Fetch user's baskets
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    });

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error in basket API:", sessionError);
      return NextResponse.json({ error: "Session error" }, { status: 401 });
    }

    if (!session || !session.user) {
      console.log("No valid session found in basket API");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("Basket API: User authenticated:", session.user.id);

    // Fetch user's baskets with items
    const { data: baskets, error: basketsError } = await supabase
      .from("baskets")
      .select(
        `
        id,
        brand_id,
        created_at,
        updated_at,
        basket_items (
          id,
          product_id,
          quantity,
          size,
          color,
          created_at
        )
      `
      )
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (basketsError) {
      console.error("Error fetching baskets:", basketsError);
      return NextResponse.json(
        { error: "Failed to fetch baskets" },
        { status: 500 }
      );
    }

    // Fetch products separately to avoid relationship issues
    const productIds = baskets?.flatMap(basket => 
      basket.basket_items?.map(item => item.product_id) || []
    ) || [];

    let products: Record<string, any> = {};
    if (productIds.length > 0) {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, price, image, brand_id")
        .in("id", productIds);

      if (!productsError && productsData) {
        productsData.forEach(product => {
          products[product.id] = product;
        });
      }
    }

    // Transform the data to match the expected format
    const transformedBaskets =
      baskets?.map((basket) => ({
        id: basket.id,
        brandId: basket.brand_id,
        createdAt: basket.created_at,
        updatedAt: basket.updated_at,
        items:
          basket.basket_items?.map((item) => {
            const product = products[item.product_id];
            return {
              id: item.id,
              productId: item.product_id,
              productName: product?.name || "Unknown Product",
              price: product?.price || 0,
              productImage: product?.image || "",
              quantity: item.quantity,
              size: item.size,
              colour: item.color,
              createdAt: item.created_at,
            };
          }) || [],
        totalItems:
          basket.basket_items?.reduce((sum, item) => sum + item.quantity, 0) ||
          0,
      })) || [];

    return NextResponse.json({
      baskets: transformedBaskets,
      user: {
        id: session.user.id,
        email: session.user.email,
      },
    });
  } catch (error) {
    console.error("Basket API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add item to basket
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    });

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error in basket API POST:", sessionError);
      return NextResponse.json({ error: "Session error" }, { status: 401 });
    }

    if (!session || !session.user) {
      console.log("No valid session found in basket API POST");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const {
      productId,
      quantity = 1,
      size,
      color,
      brandId,
    } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    console.log(
      "Basket API POST: Adding item to basket for user:",
      session.user.id
    );

    // First, check if user already has a basket for this brand
    let { data: existingBasket, error: basketError } = await supabase
      .from("baskets")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("brand_id", brandId)
      .single();

    let basketId;

    if (basketError && basketError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is expected if no basket exists
      console.error("Error checking existing basket:", basketError);
      return NextResponse.json(
        { error: "Failed to check existing basket" },
        { status: 500 }
      );
    }

    if (!existingBasket) {
      // Create new basket for this brand
      const { data: newBasket, error: createBasketError } = await supabase
        .from("baskets")
        .insert({
          user_id: session.user.id,
          brand_id: brandId,
        })
        .select("id")
        .single();

      if (createBasketError) {
        console.error("Error creating basket:", createBasketError);
        return NextResponse.json(
          { error: "Failed to create basket" },
          { status: 500 }
        );
      }

      basketId = newBasket.id;
    } else {
      basketId = existingBasket.id;
    }

    // Check if item already exists in basket
    const { data: existingItem, error: itemCheckError } = await supabase
      .from("basket_items")
      .select("id, quantity")
      .eq("basket_id", basketId)
      .eq("product_id", productId)
      .eq("size", size || null)
      .eq("color", color || null)
      .single();

    if (itemCheckError && itemCheckError.code !== "PGRST116") {
      console.error("Error checking existing item:", itemCheckError);
      return NextResponse.json(
        { error: "Failed to check existing item" },
        { status: 500 }
      );
    }

    if (existingItem) {
      // Update existing item quantity
      const { error: updateError } = await supabase
        .from("basket_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id);

      if (updateError) {
        console.error("Error updating item quantity:", updateError);
        return NextResponse.json(
          { error: "Failed to update item quantity" },
          { status: 500 }
        );
      }
    } else {
      // Add new item to basket
      const { error: insertError } = await supabase
        .from("basket_items")
        .insert({
          basket_id: basketId,
          product_id: productId,
          quantity,
          size: size || null,
          color: color || null,
        });

      if (insertError) {
        console.error("Error adding item to basket:", insertError);
        return NextResponse.json(
          { error: "Failed to add item to basket" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "Item added to basket successfully",
      user: {
        id: session.user.id,
        email: session.user.email,
      },
    });
  } catch (error) {
    console.error("Basket API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update item quantity
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    });

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error in basket API PATCH:", sessionError);
      return NextResponse.json({ error: "Session error" }, { status: 401 });
    }

    if (!session || !session.user) {
      console.log("No valid session found in basket API PATCH");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const { quantity } = await request.json();

    if (!itemId || !quantity) {
      return NextResponse.json(
        { error: "Item ID and quantity are required" },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    console.log(
      "Basket API PATCH: Updating item quantity for user:",
      session.user.id
    );

    // Update the item quantity
    const { error: updateError } = await supabase
      .from("basket_items")
      .update({ quantity })
      .eq("id", itemId)
      .eq(
        "basket_id",
        (
          await supabase
            .from("baskets")
            .select("id")
            .eq("user_id", session.user.id)
            .single()
        ).data?.id
      );

    if (updateError) {
      console.error("Error updating item quantity:", updateError);
      return NextResponse.json(
        { error: "Failed to update item quantity" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Item quantity updated successfully",
      user: {
        id: session.user.id,
        email: session.user.email,
      },
    });
  } catch (error) {
    console.error("Basket API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from basket
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    });

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error in basket API DELETE:", sessionError);
      return NextResponse.json({ error: "Session error" }, { status: 401 });
    }

    if (!session || !session.user) {
      console.log("No valid session found in basket API DELETE");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    console.log("Basket API DELETE: Removing item for user:", session.user.id);

    // Delete the item from basket
    const { error: deleteError } = await supabase
      .from("basket_items")
      .delete()
      .eq("id", itemId)
      .eq(
        "basket_id",
        (
          await supabase
            .from("baskets")
            .select("id")
            .eq("user_id", session.user.id)
            .single()
        ).data?.id
      );

    if (deleteError) {
      console.error("Error deleting item:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Item removed from basket successfully",
      user: {
        id: session.user.id,
        email: session.user.email,
      },
    });
  } catch (error) {
    console.error("Basket API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
