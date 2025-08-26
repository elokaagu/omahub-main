import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper function to create authenticated Supabase client
async function createAuthenticatedClient() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          } catch (error) {
            console.error(`Error getting cookie ${name}:`, error);
            return undefined;
          }
        },
        set() {},
        remove() {},
      },
    }
  );

  return supabase;
}

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const supabase = await createAuthenticatedClient();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return null;
    }

    if (session?.user) {
      console.log("User authenticated via session:", session.user.id);
      return session.user;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User error:", userError);
      return null;
    }

    if (user) {
      console.log("User authenticated via direct lookup:", user.id);
      return user;
    }

    console.log("No authenticated user found");
    return null;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

// POST - Submit basket and create orders
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      console.log("Authentication failed - no valid user");
      return NextResponse.json(
        { error: "Authentication required - please log in again" },
        { status: 401 }
      );
    }

    console.log("Basket Submit API: User authenticated:", user.id);

    const supabase = await createAuthenticatedClient();

    // Get user's profile for contact details
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, phone, address")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    // Fetch user's baskets with items and product details
    const { data: baskets, error: basketsError } = await supabase
      .from("baskets")
      .select(
        `
        *,
        basket_items(
          *,
          products(
            *,
            brands(
              id,
              name,
              user_id
            )
          )
        )
      `
      )
      .eq("user_id", user.id);

    if (basketsError) {
      console.error("Error fetching baskets:", basketsError);
      return NextResponse.json(
        { error: "Failed to fetch basket items" },
        { status: 500 }
      );
    }

    if (!baskets || baskets.length === 0) {
      return NextResponse.json(
        { error: "No baskets found" },
        { status: 400 }
      );
    }

    const createdOrders = [];
    const notifications = [];

    // Process each basket and create orders
    for (const basket of baskets) {
      if (!basket.basket_items || basket.basket_items.length === 0) {
        continue;
      }

      // Group items by brand
      const itemsByBrand = basket.basket_items.reduce((acc: Record<string, {
        brand: any;
        items: any[];
        total: number;
      }>, item: any) => {
        const brandId = item.products?.brands?.id;
        if (brandId) {
          if (!acc[brandId]) {
            acc[brandId] = {
              brand: item.products.brands,
              items: [],
              total: 0,
            };
          }
          acc[brandId].items.push(item);
          acc[brandId].total += item.price * item.quantity;
        }
        return acc;
      }, {});

      // Create orders for each brand
      for (const [brandId, brandData] of Object.entries(itemsByBrand) as [string, {
        brand: any;
        items: any[];
        total: number;
      }][]) {
        try {
          // Create the order
          const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
              user_id: user.id,
              brand_id: brandId,
              status: "pending",
              total_amount: brandData.total,
              currency: "GBP",
              order_type: "basket_submission",
              customer_name: profile?.full_name || user.email?.split("@")[0] || "Customer",
              customer_email: user.email,
              customer_phone: profile?.phone,
              customer_address: profile?.address,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (orderError) {
            console.error("Error creating order:", orderError);
            continue;
          }

          // Create order items
          const orderItems = brandData.items.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            colour: item.colour,
            notes: item.notes,
          }));

          const { error: orderItemsError } = await supabase
            .from("order_items")
            .insert(orderItems);

          if (orderItemsError) {
            console.error("Error creating order items:", orderItemsError);
          }

          // Create notification for brand owner
          if (brandData.brand.user_id) {
            const { error: notificationError } = await supabase
              .from("notifications")
              .insert({
                user_id: brandData.brand.user_id,
                brand_id: brandId,
                type: "new_order",
                title: "New Order Received",
                message: `You have received a new order for £${brandData.total.toFixed(2)} from ${profile?.full_name || user.email?.split("@")[0] || "Customer"}`,
                data: {
                  order_id: order.id,
                  brand_id: brandId,
                  customer_name: profile?.full_name || user.email?.split("@")[0] || "Customer",
                  total_amount: brandData.total,
                  items_count: brandData.items.length,
                  customer_email: user.email,
                  customer_phone: profile?.phone,
                },
                is_read: false,
                created_at: new Date().toISOString(),
              });

            if (notificationError) {
              console.error("Error creating notification:", notificationError);
            } else {
              notifications.push({
                brand_name: brandData.brand.name,
                order_id: order.id,
              });
            }
          }

          createdOrders.push({
            order_id: order.id,
            brand_name: brandData.brand.name,
            total: brandData.total,
            items_count: brandData.items.length,
          });

        } catch (error) {
          console.error("Error processing brand order:", error);
        }
      }
    }

    if (createdOrders.length === 0) {
      return NextResponse.json(
        { error: "No valid orders could be created" },
        { status: 500 }
      );
    }

    // Clear the user's baskets after successful order creation
    const { error: clearBasketsError } = await supabase
      .from("baskets")
      .delete()
      .eq("user_id", user.id);

    if (clearBasketsError) {
      console.error("Error clearing baskets:", clearBasketsError);
    }

    return NextResponse.json({
      success: true,
      message: "Basket submitted successfully",
      orders: createdOrders,
      notifications_sent: notifications.length,
      user: {
        id: user.id,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Basket Submit API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
