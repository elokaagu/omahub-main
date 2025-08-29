import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { sendNewsletterConfirmationEmail } from "@/lib/services/emailService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📧 Newsletter subscription request received:", body);

    // Validate required fields
    const { email, firstName, lastName, source = "website" } = body;

    if (!email) {
      console.error("❌ Missing email address");
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Invalid email format:", email);
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Get admin client for database access
    const supabase = await getAdminClient();

    if (!supabase) {
      console.error("❌ Failed to get admin client");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Check if email already exists
    console.log("🔍 Checking if email already subscribed:", email);
    const { data: existingSubscriber, error: checkError } = await supabase
      .from("newsletter_subscribers")
      .select("id, subscription_status, subscribed_at")
      .eq("email", email.toLowerCase())
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 means "no rows returned" - this is expected for new subscribers
      console.error("❌ Error checking existing subscriber:", checkError);
      return NextResponse.json(
        { error: "Failed to check subscription status" },
        { status: 500 }
      );
    }

    if (existingSubscriber) {
      if (existingSubscriber.subscription_status === "active") {
        console.log("⚠️ Email already subscribed:", email);
        return NextResponse.json(
          {
            error: "This email is already subscribed to our newsletter",
            alreadySubscribed: true,
            subscribedAt: existingSubscriber.subscribed_at,
          },
          { status: 409 }
        );
      } else if (existingSubscriber.subscription_status === "unsubscribed") {
        console.log("🔄 Reactivating unsubscribed email:", email);

        // Reactivate the subscription
        const { data: reactivatedSubscriber, error: reactivateError } =
          await supabase
            .from("newsletter_subscribers")
            .update({
              subscription_status: "active",
              unsubscribed_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingSubscriber.id)
            .select()
            .single();

        if (reactivateError) {
          console.error(
            "❌ Failed to reactivate subscription:",
            reactivateError
          );
          return NextResponse.json(
            { error: "Failed to reactivate subscription" },
            { status: 500 }
          );
        }

        console.log("✅ Subscription reactivated:", reactivatedSubscriber.id);

        // Send welcome back email
        try {
          await sendNewsletterConfirmationEmail({
            email: email.toLowerCase(),
            firstName: firstName || "there",
            lastName: lastName || "",
            isReactivation: true,
          });
          console.log("✅ Welcome back email sent");
        } catch (emailError) {
          console.error("❌ Failed to send welcome back email:", emailError);
          // Don't fail the request if email fails
        }

        return NextResponse.json({
          success: true,
          message:
            "Welcome back! Your newsletter subscription has been reactivated.",
          subscriber: reactivatedSubscriber,
          reactivated: true,
        });
      }
    }

    // Create new subscription
    console.log("📝 Creating new newsletter subscription for:", email);

    const subscriptionData = {
      email: email.toLowerCase(),
      first_name: firstName || null,
      last_name: lastName || null,
      source: source,
      subscription_status: "active",
      preferences: {
        marketing: true,
        designer_updates: true,
        events: true,
      },
    };

    const { data: newSubscriber, error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert(subscriptionData)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Failed to create subscription:", insertError);
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 500 }
      );
    }

    console.log(
      "✅ Newsletter subscription created successfully:",
      newSubscriber.id
    );

    // Send confirmation email
    try {
      console.log("📧 Sending confirmation email to:", email);
      const emailResult = await sendNewsletterConfirmationEmail({
        email: email.toLowerCase(),
        firstName: firstName || "there",
        lastName: lastName || "",
        isReactivation: false,
      });

      if (emailResult.success) {
        console.log("✅ Confirmation email sent successfully");
      } else {
        console.error(
          "❌ Failed to send confirmation email:",
          emailResult.error
        );
      }
    } catch (emailError) {
      console.error("❌ Email sending error:", emailError);
      // Don't fail the request if email fails
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message:
        "Successfully subscribed to our newsletter! Check your email for confirmation.",
      subscriber: newSubscriber,
      emailSent: true,
    });
  } catch (error) {
    console.error("💥 Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}

// GET endpoint to check subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    const { data: subscriber, error } = await supabase
      .from("newsletter_subscribers")
      .select("id, subscription_status, subscribed_at, unsubscribed_at")
      .eq("email", email.toLowerCase())
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Failed to check subscription status" },
        { status: 500 }
      );
    }

    if (!subscriber) {
      return NextResponse.json({
        subscribed: false,
        message: "Email not found in newsletter subscribers",
      });
    }

    return NextResponse.json({
      subscribed: subscriber.subscription_status === "active",
      status: subscriber.subscription_status,
      subscribedAt: subscriber.subscribed_at,
      unsubscribedAt: subscriber.unsubscribed_at,
    });
  } catch (error) {
    console.error("💥 Newsletter status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
