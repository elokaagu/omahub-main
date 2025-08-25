import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// GET - Fetch user's baskets
export async function GET() {
  try {
    // Create Supabase client with explicit cookie handling
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie) return undefined;
              
              // Handle base64 encoded cookies properly
              const value = cookie.value;
              if (value && value.startsWith('base64-')) {
                // Skip base64 cookies that might cause parsing issues
                return undefined;
              }
              
              return value;
            } catch (error) {
              console.error(`Error parsing cookie ${name}:`, error);
              return undefined;
            }
          },
          set() {},
          remove() {},
        },
      }
    );

    // Try multiple authentication methods
    let session = null;
    let user = null;
    
    // First try to get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionData?.session) {
      session = sessionData.session;
      user = sessionData.session.user;
    }
    
    // If no session, try to get user directly
    if (!user) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userData?.user) {
        user = userData.user;
      }
    }
    
    // If still no user, try to get from cookies manually
    if (!user) {
      const authCookie = cookieStore.get('sb-access-token') || cookieStore.get('supabase-auth-token');
      if (authCookie) {
        try {
          // Try to decode the JWT token to get user info
          const token = authCookie.value;
          if (token && !token.startsWith('base64-')) {
            // For now, return a more helpful error
            console.log("Auth cookie found but user not authenticated");
          }
        } catch (error) {
          console.error("Error parsing auth cookie:", error);
        }
      }
    }

    if (!user) {
      console.log("No valid user found in basket API");
      console.log("Available cookies:", Array.from(cookieStore.getAll()).map(c => c.name));
      return NextResponse.json(
        { error: "Authentication required - please log in again" },
        { status: 401 }
      );
    }

    console.log("Basket API: User authenticated:", user.id);

    // Fetch user's baskets from the database
    const { data: baskets, error: basketsError } = await supabase
      .from("baskets")
      .select(`
        *,
        basket_items (
          *,
          products (
            id,
            title,
            price,
            sale_price,
            images,
            brand:brands(name)
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (basketsError) {
      console.error("Error fetching baskets:", basketsError);
      return NextResponse.json(
        { error: "Failed to fetch baskets" },
        { status: 500 }
      );
    }

          return NextResponse.json({
        baskets: baskets || [],
        user: {
          id: user.id,
          email: user.email,
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
    // Create Supabase client with explicit cookie handling
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie) return undefined;
              
              // Handle base64 encoded cookies properly
              const value = cookie.value;
              if (value && value.startsWith('base64-')) {
                // Skip base64 cookies that might cause parsing issues
                return undefined;
              }
              
              return value;
            } catch (error) {
              console.error(`Error parsing cookie ${name}:`, error);
              return undefined;
            }
          },
          set() {},
          remove() {},
        },
      }
    );

    // Try multiple authentication methods
    let session = null;
    let user = null;
    
    // First try to get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionData?.session) {
      session = sessionData.session;
      user = sessionData.session.user;
    }
    
    // If no session, try to get user directly
    if (!user) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userData?.user) {
        user = userData.user;
      }
    }
    
    // If still no user, try to get from cookies manually
    if (!user) {
      const authCookie = cookieStore.get('sb-access-token') || cookieStore.get('supabase-auth-token');
      if (authCookie) {
        try {
          // Try to decode the JWT token to get user info
          const token = authCookie.value;
          if (token && !token.startsWith('base64-')) {
            // For now, return a more helpful error
            console.log("Auth cookie found but user not authenticated");
          }
        } catch (error) {
          console.error("Error parsing auth cookie:", error);
        }
      }
    }

    if (!user) {
      console.log("No valid user found in basket API POST");
      return NextResponse.json(
        { error: "Authentication required - please log in again" },
        { status: 401 }
      );
    }

    console.log("Basket API POST: User authenticated:", user.id);

    // Parse request body
    const { productId, quantity, size, colour } = await request.json();

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: "Product ID and quantity are required" },
        { status: 400 }
      );
    }

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(`
        *,
        brand:brands(id, name)
      `)
      .eq("id", productId)
      .single();

    if (productError || !product) {
      console.error("Error fetching product:", productError);
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Get or create user's basket
    let { data: basket, error: basketError } = await supabase
      .from("baskets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (basketError && basketError.code !== "PGRST116") {
      console.error("Error fetching basket:", basketError);
      return NextResponse.json(
        { error: "Failed to fetch basket" },
        { status: 500 }
      );
    }

    // Create basket if it doesn't exist
    if (!basket) {
      const { data: newBasket, error: createBasketError } = await supabase
        .from("baskets")
        .insert({
          user_id: user.id,
          total_items: 0,
          total_price: 0,
        })
        .select()
        .single();

      if (createBasketError) {
        console.error("Error creating basket:", createBasketError);
        return NextResponse.json(
          { error: "Failed to create basket" },
          { status: 500 }
        );
      }
      basket = newBasket;
    }

    // Add item to basket
    const { data: basketItem, error: addItemError } = await supabase
      .from("basket_items")
      .insert({
        basket_id: basket.id,
        product_id: productId,
        quantity: quantity,
        size: size,
        colour: colour,
        price: product.sale_price || product.price,
      })
      .select()
      .single();

    if (addItemError) {
      console.error("Error adding item to basket:", addItemError);
      return NextResponse.json(
        { error: "Failed to add item to basket" },
        { status: 500 }
      );
    }

    // Update basket totals
    const { error: updateBasketError } = await supabase
      .from("baskets")
      .update({
        total_items: basket.total_items + quantity,
        total_price: basket.total_price + (product.sale_price || product.price) * quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", basket.id);

    if (updateBasketError) {
      console.error("Error updating basket totals:", updateBasketError);
    }

    // Create notification for brand owner
    if (product.brand?.id) {
      try {
        await supabase.from("notifications").insert({
          brand_id: product.brand.id,
          user_id: user.id,
          type: "basket_submission",
          title: "New Basket Item",
          message: `${product.title} added to basket`,
          data: {
            basket_item_id: basketItem.id,
            product_id: productId,
            product_title: product.title,
            product_price: product.sale_price || product.price,
            quantity: quantity,
            size: size,
            colour: colour,
            customer_email: user.email,
            customer_id: user.id,
          },
        });
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
        // Don't fail the basket operation if notification fails
      }
    }

    return NextResponse.json({
      message: "Item added to basket successfully",
      basketItem: {
        ...basketItem,
        product: product,
      },
      user: {
        id: user.id,
        email: user.email,
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
    // Create Supabase client with explicit cookie handling
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie) return undefined;
              
              // Handle base64 encoded cookies properly
              const value = cookie.value;
              if (value && value.startsWith('base64-')) {
                // Skip base64 cookies that might cause parsing issues
                return undefined;
              }
              
              return value;
            } catch (error) {
              console.error(`Error parsing cookie ${name}:`, error);
              return undefined;
            }
          },
          set() {},
          remove() {},
        },
      }
    );

    // Try multiple authentication methods
    let session = null;
    let user = null;
    
    // First try to get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionData?.session) {
      session = sessionData.session;
      user = sessionData.session.user;
    }
    
    // If no session, try to get user directly
    if (!user) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userData?.user) {
        user = userData.user;
      }
    }
    
    // If still no user, try to get from cookies manually
    if (!user) {
      const authCookie = cookieStore.get('sb-access-token') || cookieStore.get('supabase-auth-token');
      if (authCookie) {
        try {
          // Try to decode the JWT token to get user info
          const token = authCookie.value;
          if (token && !token.startsWith('base64-')) {
            // For now, return a more helpful error
            console.log("Auth cookie found but user not authenticated");
          }
        } catch (error) {
          console.error("Error parsing auth cookie:", error);
        }
      }
    }

    if (!user) {
      console.log("No valid user found in basket API PATCH");
      return NextResponse.json(
        { error: "Authentication required - please log in again" },
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

    console.log("Basket API PATCH: User authenticated:", user.id);

    // Get basket item details
    const { data: basketItem, error: itemError } = await supabase
      .from("basket_items")
      .select(`
        *,
        basket:baskets(user_id, total_items, total_price)
      `)
      .eq("id", itemId)
      .single();

    if (itemError || !basketItem) {
      return NextResponse.json(
        { error: "Basket item not found" },
        { status: 404 }
      );
    }

    // Verify user owns this basket
    if (basketItem.basket.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Calculate price difference
    const oldTotal = basketItem.price * basketItem.quantity;
    const newTotal = basketItem.price * quantity;
    const priceDifference = newTotal - oldTotal;

    // Update basket item
    const { error: updateItemError } = await supabase
      .from("basket_items")
      .update({
        quantity: quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId);

    if (updateItemError) {
      console.error("Error updating basket item:", updateItemError);
      return NextResponse.json(
        { error: "Failed to update basket item" },
        { status: 500 }
      );
    }

    // Update basket totals
    const { error: updateBasketError } = await supabase
      .from("baskets")
      .update({
        total_items: basketItem.basket.total_items - basketItem.quantity + quantity,
        total_price: basketItem.basket.total_price + priceDifference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", basketItem.basket_id);

    if (updateBasketError) {
      console.error("Error updating basket totals:", updateBasketError);
    }

    return NextResponse.json({
      message: "Item updated successfully",
      user: {
        id: user.id,
        email: user.email,
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
    // Create Supabase client with explicit cookie handling
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              if (!cookie) return undefined;
              
              // Handle base64 encoded cookies properly
              const value = cookie.value;
              if (value && value.startsWith('base64-')) {
                // Skip base64 cookies that might cause parsing issues
                return undefined;
              }
              
              return value;
            } catch (error) {
              console.error(`Error parsing cookie ${name}:`, error);
              return undefined;
            }
          },
          set() {},
          remove() {},
        },
      }
    );

    // Try multiple authentication methods
    let session = null;
    let user = null;
    
    // First try to get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionData?.session) {
      session = sessionData.session;
      user = sessionData.session.user;
    }
    
    // If no session, try to get user directly
    if (!user) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userData?.user) {
        user = userData.user;
      }
    }
    
    // If still no user, try to get from cookies manually
    if (!user) {
      const authCookie = cookieStore.get('sb-access-token') || cookieStore.get('supabase-auth-token');
      if (authCookie) {
        try {
          // Try to decode the JWT token to get user info
          const token = authCookie.value;
          if (token && !token.startsWith('base64-')) {
            // For now, return a more helpful error
            console.log("Auth cookie found but user not authenticated");
          }
        } catch (error) {
          console.error("Error parsing auth cookie:", error);
        }
      }
    }

    if (!user) {
      console.log("No valid user found in basket API DELETE");
      return NextResponse.json(
        { error: "Authentication required - please log in again" },
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

    console.log("Basket API DELETE: User authenticated:", user.id);

    // Get basket item details
    const { data: basketItem, error: itemError } = await supabase
      .from("basket_items")
      .select(`
        *,
        basket:baskets(user_id, total_items, total_price)
      `)
      .eq("id", itemId)
      .single();

    if (itemError || !basketItem) {
      return NextResponse.json(
        { error: "Basket item not found" },
        { status: 404 }
      );
    }

    // Verify user owns this basket
    if (basketItem.basket.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Calculate price to subtract
    const itemTotal = basketItem.price * basketItem.quantity;

    // Delete basket item
    const { error: deleteItemError } = await supabase
      .from("basket_items")
      .delete()
      .eq("id", itemId);

    if (deleteItemError) {
      console.error("Error deleting basket item:", deleteItemError);
      return NextResponse.json(
        { error: "Failed to delete basket item" },
        { status: 500 }
      );
    }

    // Update basket totals
    const { error: updateBasketError } = await supabase
      .from("baskets")
      .update({
        total_items: basketItem.basket.total_items - basketItem.quantity,
        total_price: basketItem.basket.total_price - itemTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", basketItem.basket_id);

    if (updateBasketError) {
      console.error("Error updating basket totals:", updateBasketError);
    }

    return NextResponse.json({
      message: "Item removed successfully",
      user: {
        id: user.id,
        email: user.email,
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
