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
      size,
      color,
      quantity,
      measurements,
    } = orderData;

    console.log("Parsed order data:", {
      user_id,
      product_id,
      brand_id,
      customer_notes,
      delivery_address,
      total_amount,
      size,
      color,
      quantity,
    });

    // Validate required fields (user_id is now optional)
    if (!product_id || !brand_id || !delivery_address) {
      console.error("Missing required fields:", {
        product_id,
        brand_id,
        delivery_address,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get product and brand details
    const [productResult, brandResult] = await Promise.all([
      supabase.from("products").select("*").eq("id", product_id).single(),
      supabase.from("brands").select("*").eq("id", brand_id).single(),
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

    const product = productResult.data;
    const brand = brandResult.data;

    // Handle user_id - create guest user if not provided
    let finalUserId = user_id;
    let userProfile = null;

    if (!user_id) {
      // For unauthenticated users, use a temporary approach
      // Instead of creating a full profile, we'll use a guest identifier
      const guestEmail = delivery_address.email;
      const guestName = delivery_address.full_name;
      
      // Create a simple guest user record or use existing one
      try {
        // First, try to find an existing guest profile with this email
        const { data: existingGuest, error: findError } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, role")
          .eq("email", guestEmail)
          .single();

        if (existingGuest && !findError) {
          // Use existing guest profile
          finalUserId = existingGuest.id;
          userProfile = existingGuest;
          console.log("✅ Using existing guest profile:", existingGuest.id);
        } else {
          // Create a minimal guest profile
          const { data: guestUser, error: guestUserError } = await supabase
            .from("profiles")
            .insert({
              email: guestEmail,
              first_name: guestName.split(" ")[0] || "Guest",
              last_name: guestName.split(" ").slice(1).join(" ") || "User",
              role: "user",
              username: `guest_${Date.now()}`, // Generate unique username
              avatar_url: "", // Empty avatar
              bio: "", // Empty bio
              location: "", // Empty location
              website: "", // Empty website
              owned_brands: [], // No owned brands
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (guestUserError) {
            console.error("❌ Error creating guest user:", guestUserError);
            console.error("❌ Guest user data attempted:", {
              email: guestEmail,
              first_name: guestName.split(" ")[0] || "Guest",
              last_name: guestName.split(" ").slice(1).join(" ") || "User",
              role: "user",
              username: `guest_${Date.now()}`,
            });
            
            // Fallback: use a system-generated user ID for this order
            finalUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            userProfile = {
              id: finalUserId,
              email: guestEmail,
              role: "guest",
              owned_brands: [],
            };
            console.log("⚠️ Using fallback guest user ID:", finalUserId);
          } else {
            finalUserId = guestUser.id;
            userProfile = guestUser;
            console.log("✅ Created new guest profile:", guestUser.id);
          }
        }
      } catch (error) {
        console.error("❌ Unexpected error in guest user handling:", error);
        // Final fallback: use a system-generated user ID
        finalUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        userProfile = {
          id: finalUserId,
          email: delivery_address.email,
          role: "guest",
          owned_brands: [],
        };
        console.log("⚠️ Using emergency fallback guest user ID:", finalUserId);
      }
    } else {
      // Fetch existing user profile
      const { data: existingUser, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user_id)
        .single();

      if (userError) {
        console.log("⚠️ Profile fetch failed, using fallback:", userError);
        userProfile = {
          id: user_id,
          email: delivery_address.email,
          role: "user",
          owned_brands: [],
        };
      } else {
        userProfile = existingUser;
      }
    }

    // Create the order in the database
    console.log('💾 Saving order to database with data:', {
      user_id: finalUserId,
      product_id,
      brand_id,
      status: 'pending',
      total_amount: total_amount || product.sale_price || product.price,
      measurements: {
        fit_preference: orderData.measurements?.fit_preference || null,
        length_preference: orderData.measurements?.length_preference || null,
        sleeve_preference: orderData.measurements?.sleeve_preference || null,
      },
      size: orderData.size || null,
      color: orderData.color || null,
      quantity: orderData.quantity || 1,
    });
    
    const { data: order, error: orderError } = await supabase
      .from("tailored_orders")
      .insert({
        user_id: finalUserId,
        product_id,
        brand_id,
        status: "pending",
        total_amount: total_amount || product.sale_price || product.price,
        currency: "USD",
        customer_notes: customer_notes || "",
        
        // Save actual measurements data instead of empty object
        measurements: {
          fit_preference: orderData.measurements?.fit_preference || null,
          length_preference: orderData.measurements?.length_preference || null,
          sleeve_preference: orderData.measurements?.sleeve_preference || null,
          height: orderData.measurements?.height || null,
          weight: orderData.measurements?.weight || null,
          chest: orderData.measurements?.chest || null,
          waist: orderData.measurements?.waist || null,
          hips: orderData.measurements?.hips || null,
          inseam: orderData.measurements?.inseam || null,
          shoulder: orderData.measurements?.shoulder || null,
          arm_length: orderData.measurements?.arm_length || null,
          neck: orderData.measurements?.neck || null,
          custom_measurements: orderData.measurements?.custom_measurements || null
        },
        
        // Save product preferences
        size: orderData.size || null,
        color: orderData.color || null,
        quantity: orderData.quantity || 1,
        
        // Save delivery address
        delivery_address: {
          full_name: delivery_address.full_name,
          email: delivery_address.email,
          phone: delivery_address.phone,
          address_line_1: delivery_address.address_line_1,
          city: delivery_address.city,
          state: delivery_address.state,
          postal_code: delivery_address.postal_code,
          country: delivery_address.country
        },
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error("❌ Error creating order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    console.log('✅ Order saved successfully with ID:', order.id);

    // Create a lead from this order (custom order or basic request)
    try {
      console.log("📊 Creating lead from order...");
      
      // Determine if this is a custom order or basic request
      const isCustomOrder = measurements && Object.keys(measurements).length > 0;
      const source = isCustomOrder ? "custom_order" : "product_request";
      const orderType = isCustomOrder ? "Custom order" : "Product request";
      
      // Create lead in the leads table
      const leadData = {
        brand_id: brand_id,
        customer_name: delivery_address.full_name,
        customer_email: delivery_address.email,
        customer_phone: delivery_address.phone || "",
        source: source,
        lead_type: "product_request",
        status: "converted", // Automatically converted since they've already ordered
        priority: "high",
        notes: `${orderType} for ${product.title}\n\nCustomer notes: ${customer_notes || 'None'}\n\nSize: ${size || 'Not specified'}\nColor: ${color || 'Not specified'}\nQuantity: ${quantity}\n\nStatus: Automatically marked as converted since customer has already submitted an order.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert(leadData)
        .select()
        .single();

      if (leadError) {
        console.error("❌ Failed to create lead:", leadError);
        console.log("⚠️ Lead creation failed, but order was created successfully");
      } else {
        console.log("✅ Lead created successfully:", lead.id);
        console.log("📊 Lead data:", {
          id: lead.id,
          customer_name: lead.customer_name,
          status: lead.status,
          source: lead.source,
          notes: lead.notes
        });
      }
    } catch (leadError) {
      console.error("❌ Error creating lead:", leadError);
      console.log("⚠️ Lead creation failed, but order was created successfully");
    }

    // Create an inquiry from this order (custom order or basic request)
    try {
      console.log("📧 Creating inquiry from order...");
      
      // Determine if this is a custom order or basic request
      const isCustomOrder = measurements && Object.keys(measurements).length > 0;
      const source = isCustomOrder ? "custom_order" : "product_request";
      const orderType = isCustomOrder ? "Custom order" : "Product request";
      
      const inquiryData = {
        brand_id: brand_id,
        customer_name: delivery_address.full_name,
        customer_email: delivery_address.email,
        customer_phone: delivery_address.phone || null,
        subject: `${orderType} Request - ${product.title}`,
        message: `Customer ${delivery_address.full_name} has submitted a ${orderType.toLowerCase()} request for ${product.title}.

Order Details:
- Product: ${product.title}
- Size: ${size || 'Not specified'}
- Color: ${color || 'Not specified'}
- Quantity: ${quantity || 1}
- Total Amount: ${total_amount || product.sale_price || product.price}
- Customer Notes: ${customer_notes || 'None'}

Delivery Address:
- ${delivery_address.full_name}
- ${delivery_address.email}
- ${delivery_address.phone || 'No phone'}
- ${delivery_address.address_line_1 || ''}
- ${delivery_address.city || ''}, ${delivery_address.state || ''} ${delivery_address.postal_code || ''}
- ${delivery_address.country || ''}

This ${orderType.toLowerCase()} has been completed and saved to your leads dashboard. The customer has already submitted their order details.`,
        inquiry_type: "product_request",
        priority: "high",
        source: source,
        status: "replied", // Mark as replied since this is a completed order request
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: inquiry, error: inquiryError } = await supabase
        .from("inquiries")
        .insert(inquiryData)
        .select()
        .single();

      if (inquiryError) {
        console.error("❌ Failed to create inquiry:", inquiryError);
        console.log("⚠️ Inquiry creation failed, but order and lead were created successfully");
      } else {
        console.log("✅ Inquiry created successfully:", inquiry.id);
        console.log("📧 Inquiry data:", {
          id: inquiry.id,
          customer_name: inquiry.customer_name,
          subject: inquiry.subject,
          status: inquiry.status,
          source: inquiry.source
        });
      }
    } catch (inquiryError) {
      console.error("❌ Error creating inquiry:", inquiryError);
      console.log("⚠️ Inquiry creation failed, but order and lead were created successfully");
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

    // Send email notification to admin
    const adminEmailRecipient = "info@oma-hub.com";

    // Try to send email if Resend is configured
    let emailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Send email to admin
        await resend.emails.send({
          from: "OmaHub <info@oma-hub.com>",
          to: [adminEmailRecipient],
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

        // Send email to brand's contact email if available
        if (brand.contact_email && brand.contact_email !== adminEmailRecipient) {
          try {
            await resend.emails.send({
              from: "OmaHub <info@oma-hub.com>",
              to: [brand.contact_email],
              subject: `New Custom Order Request - ${product.title}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #8B4513;">New Custom Order Request</h2>
                  <p style="color: #666; font-size: 16px;">You have received a new custom order request through OmaHub!</p>
                  
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
                  
                  <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    <strong>Important:</strong> You can also view and manage this order in your OmaHub Studio dashboard.
                  </p>
                </div>
              `,
            });
            console.log("Brand notification email sent successfully to:", brand.contact_email);
          } catch (brandEmailError) {
            console.error("Error sending brand notification email:", brandEmailError);
            // Don't fail the order creation if brand email fails
          }
        }

        emailSent = true;
        console.log("Order notification emails sent successfully");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the order creation if email fails
      }
    } else {
      console.log("RESEND_API_KEY not configured, skipping email notification");
    }

    // Send confirmation email to customer
    let customerEmailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: "OmaHub <info@oma-hub.com>",
          to: [delivery_address.email],
          subject: `Order Confirmation - ${product.title} from ${brand.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #8B4513;">Order Confirmation</h2>
              <p style="color: #666; font-size: 16px;">Thank you for your custom order request!</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #8B4513;">Order Details</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Product:</strong> ${product.title}</p>
                <p><strong>Brand:</strong> ${brand.name}</p>
                <p><strong>Price:</strong> ${extractCurrencyFromPriceRange(brand.price_range)} ${total_amount || product.sale_price || product.price}</p>
                <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #8B4513;">What Happens Next?</h3>
                <ul>
                  <li>The brand will contact you within 24-48 hours to discuss your order</li>
                  <li>You'll discuss measurements, customization details, and final pricing</li>
                  <li>The brand will provide an estimated completion timeline</li>
                  <li>You'll receive updates on your order progress</li>
                </ul>
              </div>

              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #8B4513;">Order Summary</h3>
                <p><strong>Customer:</strong> ${delivery_address.full_name}</p>
                <p><strong>Email:</strong> ${delivery_address.email}</p>
                <p><strong>Phone:</strong> ${delivery_address.phone}</p>
                <p><strong>Address:</strong> ${delivery_address.city}, ${delivery_address.state} ${delivery_address.postal_code}, ${delivery_address.country}</p>
                ${customer_notes ? `<p><strong>Special Notes:</strong> ${customer_notes}</p>` : ""}
              </div>

              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #8B4513;">Need Help?</h3>
                <p>If you have any questions about your order, please contact us at <a href="mailto:support@oma-hub.com">support@oma-hub.com</a></p>
                <p>Thank you for choosing OmaHub for your custom fashion needs!</p>
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
      console.log(
        "RESEND_API_KEY not configured, skipping customer confirmation email"
      );
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
      customerEmailSent,
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
