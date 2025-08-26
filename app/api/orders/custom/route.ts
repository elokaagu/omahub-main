import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractCurrencyFromPriceRange } from "@/lib/utils/priceFormatter";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    console.log("Custom order submission received:", orderData);

    const {
      user_id,
      product_id,
      brand_id,
      customer_notes,
      delivery_address,
      total_amount,
    } = orderData;

    // Validate required fields
    if (!user_id || !product_id || !brand_id || !delivery_address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get product and brand details for the email
    const [productResult, brandResult, userResult] = await Promise.all([
      supabase.from("products").select("*").eq("id", product_id).single(),
      supabase.from("brands").select("*").eq("id", brand_id).single(),
      supabase.from("profiles").select("*").eq("id", user_id).single(),
    ]);

    if (productResult.error || brandResult.error) {
      console.error("Error fetching product or brand data:", {
        product: productResult.error,
        brand: brandResult.error,
      });
      return NextResponse.json(
        { error: "Failed to fetch order details" },
        { status: 500 }
      );
    }

    // Handle profile fetch error gracefully
    let userProfile = userResult.data;
    if (userResult.error) {
      console.log("⚠️ Profile fetch failed, using fallback:", userResult.error);
      // Use fallback profile data
      userProfile = {
        id: user_id,
        email: "customer@example.com", // Fallback email
        role: "user",
        owned_brands: [],
      };
    }

    const product = productResult.data;
    const brand = brandResult.data;
    const user = userProfile;

    // Create the order in the database
    const { data: order, error: orderError } = await supabase
      .from("tailored_orders")
      .insert({
        user_id,
        product_id,
        brand_id,
        status: "pending",
        total_amount: total_amount || product.sale_price || product.price,
        currency: "USD",
        customer_notes: customer_notes || "",
        measurements: {}, // Empty measurements object for now
        delivery_address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Create notification for brand owner
    try {
      const { data: brandOwner, error: brandOwnerError } = await supabase
        .from("brands")
        .select("user_id")
        .eq("id", brand_id)
        .single();

      if (brandOwnerError || !brandOwner?.user_id) {
        console.error("Error fetching brand owner:", brandOwnerError);
      } else {
        await supabase.from("notifications").insert({
          user_id: brandOwner.user_id,
          brand_id: brand_id,
          type: "new_order",
          title: "New Custom Order Request",
          message: `New custom order request for ${product.title} from ${delivery_address.full_name}`,
          data: {
            order_id: order.id,
            product_id: product_id,
            product_title: product.title,
            customer_name: delivery_address.full_name,
            customer_email: delivery_address.email,
            customer_phone: delivery_address.phone,
            total_amount: total_amount || product.sale_price || product.price,
            customer_notes: customer_notes,
          },
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Don't fail the order creation if notification fails
    }

    // Generate order number
    const orderNumber = `OMH-${order.id.slice(-8).toUpperCase()}`;

    // Send email notification to eloka@satellitelabs.xyz
    const emailRecipient = "eloka@satellitelabs.xyz";

    // Try to send email if Resend is configured
    let emailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "OmaHub <info@oma-hub.com>",
          to: [emailRecipient],
          subject: `New Custom Order Request - ${product.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B4513;">New Custom Order Request</h2>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Product:</strong> ${product.title}</p>
                <p><strong>Brand:</strong> ${brand.name}</p>
                <p><strong>Price:</strong> ${extractCurrencyFromPriceRange(brand.price_range)} ${total_amount || product.sale_price || product.price}</p>
                <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${delivery_address.full_name}</p>
                <p><strong>Email:</strong> ${delivery_address.email}</p>
                <p><strong>Phone:</strong> ${delivery_address.phone}</p>
                <p><strong>Address:</strong> ${delivery_address.address_line_1}, ${delivery_address.city}, ${delivery_address.state} ${delivery_address.postal_code}, ${delivery_address.country}</p>
              </div>

              ${
                customer_notes
                  ? `
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Customer Notes</h3>
                <p>${customer_notes}</p>
              </div>
              `
                  : ""
              }

              <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>Next Steps</h3>
                <ul>
                  <li>Contact the customer within 24-48 hours to discuss measurements and details</li>
                  <li>Confirm the order and pricing</li>
                  <li>Arrange for measurements if needed</li>
                  <li>Provide estimated completion timeline</li>
                </ul>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This order was submitted through OmaHub. Please respond to the customer directly at ${delivery_address.email}.
              </p>
            </div>
          `,
        });

        emailSent = true;
        console.log("Order notification email sent successfully");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the order creation if email fails
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email notification");
    }

    // Log the order details for manual processing if email fails
    console.log("=== NEW CUSTOM ORDER ===");
    console.log(`Order Number: ${orderNumber}`);
    console.log(`Product: ${product.title} by ${brand.name}`);
    console.log(
      `Customer: ${delivery_address.full_name} (${delivery_address.email})`
    );
    console.log(`Phone: ${delivery_address.phone}`);
    console.log(
      `Address: ${delivery_address.address_line_1}, ${delivery_address.city}, ${delivery_address.state} ${delivery_address.postal_code}, ${delivery_address.country}`
    );
    console.log(
      `Price: ${extractCurrencyFromPriceRange(brand.price_range)} ${total_amount || product.sale_price || product.price}`
    );
    if (customer_notes) {
      console.log(`Notes: ${customer_notes}`);
    }
    console.log("========================");

    return NextResponse.json({
      success: true,
      order,
      orderNumber,
      emailSent,
      message: "Order submitted successfully",
    });
  } catch (error) {
    console.error("Error processing custom order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
