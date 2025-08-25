import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies, headers } from "next/headers";

// GET - Fetch user's baskets
export async function GET() {
  try {
    const cookieStore = cookies();
    console.log("Basket API: Cookie store available:", !!cookieStore);

    // Log all cookies for debugging
    const allCookies = cookieStore.getAll();
    console.log(
      "Basket API: All cookies:",
      allCookies.map((c) => c.name)
    );

    // Check for Supabase auth cookies specifically
    const supabaseCookies = allCookies.filter((c) => c.name.includes("sb-"));
    console.log(
      "Basket API: Supabase cookies:",
      supabaseCookies.map((c) => ({
        name: c.name,
        value: c.value.substring(0, 20) + "...",
      }))
    );

    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    });

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("Basket API: Session check result:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionError: sessionError?.message,
    });

    if (sessionError) {
      console.error("Session error in basket API:", sessionError);
      return NextResponse.json({ error: "Session error" }, { status: 401 });
    }

    if (!session || !session.user) {
      console.log("No valid session found in basket API");

      // For debugging, let's try to get user info from the request headers
      const authHeader = headers().get("authorization");
      if (authHeader) {
        console.log(
          "Basket API: Found Authorization header:",
          authHeader.substring(0, 20) + "..."
        );

        // Try to validate the token and get user info
        try {
          const token = authHeader.replace("Bearer ", "");
          const { createClient } = await import("@supabase/supabase-js");
          const clientSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

          const {
            data: { user },
            error: userError,
          } = await clientSupabase.auth.getUser(token);

          if (user && !userError) {
            console.log(
              "Basket API: User authenticated via token:",
              user.email
            );
            // Continue with the user found via token
            const fallbackSession = { user };

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
              .eq("user_id", fallbackSession.user.id)
              .order("created_at", { ascending: false });

            if (basketsError) {
              console.error("Error fetching baskets:", basketsError);
              return NextResponse.json(
                { error: "Failed to fetch baskets" },
                { status: 500 }
              );
            }

            // Fetch products separately to avoid relationship issues
            const productIds =
              baskets?.flatMap(
                (basket) =>
                  basket.basket_items?.map((item) => item.product_id) || []
              ) || [];

            let products: Record<string, any> = {};
            if (productIds.length > 0) {
              const { data: productsData, error: productsError } =
                await supabase
                  .from("products")
                  .select("id, name, price, image, brand_id")
                  .in("id", productIds);

              if (!productsError && productsData) {
                productsData.forEach((product) => {
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
                  basket.basket_items?.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  ) || 0,
              })) || [];

            return NextResponse.json({
              baskets: transformedBaskets,
              user: {
                id: fallbackSession.user.id,
                email: fallbackSession.user.email,
              },
            });
          }
        } catch (tokenError) {
          console.error("Basket API: Token validation failed:", tokenError);
        }
      }

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
    const productIds =
      baskets?.flatMap(
        (basket) => basket.basket_items?.map((item) => item.product_id) || []
      ) || [];

    let products: Record<string, any> = {};
    if (productIds.length > 0) {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, price, image, brand_id")
        .in("id", productIds);

      if (!productsError && productsData) {
        productsData.forEach((product) => {
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
      const { data: basketItem, error: insertError } = await supabase
        .from("basket_items")
        .insert({
          basket_id: basketId,
          product_id: productId,
          quantity,
          size,
          color,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating basket item:", insertError);
        return NextResponse.json(
          { error: "Failed to create basket item" },
          { status: 500 }
        );
      }

      // Get product details for notification
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("title, price")
        .eq("id", productId)
        .single();

      // Create notification for brand owner
      try {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            brand_id: brandId,
            user_id: session.user.id,
            type: "basket_submission",
            title: "New Basket Item Added",
            message: `A customer added ${quantity}x ${product?.title || "product"} to their basket`,
            data: {
              basket_item_id: basketItem.id,
              product_id: productId,
              product_title: product?.title,
              product_price: product?.price,
              quantity,
              size,
              color,
              customer_email: session.user.email,
              customer_id: session.user.id,
            },
          });

        if (notificationError) {
          console.error("Error creating notification:", notificationError);
          // Don't fail the basket operation if notification fails
        } else {
          console.log("Notification created for brand owner");
        }
      } catch (notificationError) {
        console.error("Error in notification creation:", notificationError);
        // Don't fail the basket operation if notification fails
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
