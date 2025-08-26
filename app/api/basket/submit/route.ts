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
          // Use the correct price field from products
          const itemPrice = item.products?.sale_price || item.products?.price || 0;
          acc[brandId].total += itemPrice * item.quantity;
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
              total: brandData.total, // Database uses 'total', not 'total_amount'
              currency: "GBP", // Database uses 'GBP' instead of 'NGN'
              delivery_address: profile?.address || {}, // Database expects JSONB
              customer_notes: `Order submitted from basket`,
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
            price: item.products?.sale_price || item.products?.price || 0, // Use correct price field
            size: item.size,
            color: item.color, // Database uses 'color', not 'colour'
            // Remove notes field as it doesn't exist in database schema
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

    // Send confirmation email to customer
    let customerEmailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Prepare order summary for email
        const orderSummary = createdOrders.map(order => 
          `• ${order.brand_name}: ${order.items_count} item(s) - £${order.total.toFixed(2)}`
        ).join('\n');

        const totalAmount = createdOrders.reduce((sum, order) => sum + order.total, 0);

        await resend.emails.send({
          from: "OmaHub <info@oma-hub.com>",
          to: [user.email!],
          subject: `Order Confirmation - ${createdOrders.length} Order(s) Submitted`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B4513;">Order Confirmation</h2>
              <p style="color: #666; font-size: 16px;">Thank you for your order(s)!</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #8B4513;">Order Summary</h3>
                <p><strong>Total Orders:</strong> ${createdOrders.length}</p>
                <p><strong>Total Amount:</strong> £${totalAmount.toFixed(2)}</p>
                <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #8B4513;">Order Details</h3>
                <div style="white-space: pre-line; font-family: monospace; background: white; padding: 10px; border-radius: 4px;">
${orderSummary}
                </div>
              </div>

              <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #8B4513;">What Happens Next?</h3>
                <ul>
                  <li>Each brand will contact you within 24-48 hours to confirm your order</li>
                  <li>You'll discuss any customization details, measurements, and final pricing</li>
                  <li>The brands will provide estimated completion timelines</li>
                  <li>You'll receive updates on your order progress</li>
                </ul>
              </div>

              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #8B4513;">Need Help?</h3>
                <p>If you have any questions about your orders, please contact us at <a href="mailto:support@oma-hub.com">support@oma-hub.com</a></p>
                <p>Thank you for choosing OmaHub!</p>
              </div>
            </div>
          `,
        });

        customerEmailSent = true;
        console.log("Customer confirmation email sent successfully");
      } catch (emailError) {
        console.error("Error sending customer confirmation email:", emailError);
        // Don't fail the order creation if email fails
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping customer confirmation email");
    }

    return NextResponse.json({
      success: true,
      message: "Basket submitted successfully",
      orders: createdOrders,
      notifications_sent: notifications.length,
      customerEmailSent,
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
