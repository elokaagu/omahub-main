import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-unified";

// Helper function to extract project details from message
function analyzeInquiryMessage(message: string, inquiryType: string) {
  const lowerMessage = message.toLowerCase();

  // Estimate budget based on keywords and context
  let estimatedValue = 2000; // Default
  let priority = "normal";
  let projectTimeline = "3-6 months";
  let leadType = "inquiry";

  // Budget estimation
  if (lowerMessage.includes("budget") || lowerMessage.includes("$")) {
    // Try to extract budget numbers
    const budgetMatch = message.match(/\$[\d,]+/);
    if (budgetMatch) {
      const budgetStr = budgetMatch[0].replace(/[$,]/g, "");
      const budgetNum = parseInt(budgetStr);
      if (!isNaN(budgetNum)) {
        estimatedValue = budgetNum;
      }
    }
  }

  // Project type and value estimation
  if (lowerMessage.includes("wedding")) {
    estimatedValue = Math.max(estimatedValue, 5000);
    priority = "high";
    leadType = "booking_intent";
  } else if (lowerMessage.includes("event") || lowerMessage.includes("party")) {
    estimatedValue = Math.max(estimatedValue, 3000);
    priority = "high";
    leadType = "booking_intent";
  } else if (lowerMessage.includes("corporate")) {
    estimatedValue = Math.max(estimatedValue, 4000);
    priority = "high";
    leadType = "booking_intent";
  } else if (
    lowerMessage.includes("custom") ||
    lowerMessage.includes("bespoke")
  ) {
    estimatedValue = Math.max(estimatedValue, 2500);
    leadType = "booking_intent";
  } else if (lowerMessage.includes("consultation")) {
    estimatedValue = Math.max(estimatedValue, 500);
    leadType = "consultation";
  } else if (lowerMessage.includes("quote") || lowerMessage.includes("price")) {
    leadType = "quote_request";
  }

  // Timeline estimation
  if (
    lowerMessage.includes("urgent") ||
    lowerMessage.includes("asap") ||
    lowerMessage.includes("soon")
  ) {
    projectTimeline = "ASAP";
    priority = "high";
  } else if (
    lowerMessage.includes("next week") ||
    lowerMessage.includes("this month")
  ) {
    projectTimeline = "1-3 months";
    priority = "high";
  } else if (
    lowerMessage.includes("next month") ||
    lowerMessage.includes("few months")
  ) {
    projectTimeline = "3-6 months";
  } else if (
    lowerMessage.includes("next year") ||
    lowerMessage.includes("planning ahead")
  ) {
    projectTimeline = "6+ months";
  }

  return {
    estimatedValue,
    priority,
    projectTimeline,
    leadType,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📧 Contact API - Request received:", body);

    // Check if this is a brand-specific contact or general platform contact
    const isBrandContact = body.brandId && body.brandName;

    if (isBrandContact) {
      // Handle brand-specific contact form
      const { name, email, message, brandId, brandName } = body;

      // Validate required fields for brand contact
      if (!name || !email || !message || !brandId) {
        console.error("❌ Missing required fields for brand contact:", {
          name: !!name,
          email: !!email,
          message: !!message,
          brandId: !!brandId,
        });
        return NextResponse.json(
          { error: "All fields are required" },
          { status: 400 }
        );
      }

      const supabase = createAdminClient();

      // Verify brand exists
      console.log("🔍 Checking if brand exists:", brandId);
      const { data: brand, error: brandError } = await supabase
        .from("brands")
        .select("id, name, category")
        .eq("id", brandId)
        .single();

      if (brandError || !brand) {
        console.error("❌ Brand not found:", brandId, brandError);
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      }

      console.log("✅ Brand found:", brand);

      // Analyze the message for intelligent lead scoring
      const analysis = analyzeInquiryMessage(message, "general");

      try {
        // Create inquiry for Studio Inbox
        console.log("📝 Creating inquiry...");
        const inquiryData = {
          brand_id: brandId,
          customer_name: name,
          customer_email: email,
          subject: `New Contact from ${name}`,
          message: message,
          inquiry_type: "general",
          priority: analysis.priority,
          status: "unread",
          source: "website",
        };

        const { data: inquiry, error: inquiryError } = await supabase
          .from("inquiries")
          .insert(inquiryData)
          .select()
          .single();

        if (inquiryError) {
          console.error("❌ Failed to create inquiry:", inquiryError);
          throw new Error("Failed to create inquiry");
        }

        console.log("✅ Inquiry created:", inquiry.id);

        // Create lead for Leads Management
        console.log("🎯 Creating lead...");
        const leadData = {
          brand_id: brandId,
          customer_name: name,
          customer_email: email,
          source: "website",
          lead_type: analysis.leadType,
          status: "new",
          priority: analysis.priority,
          estimated_value: analysis.estimatedValue,
          notes: message,
        };

        const { data: lead, error: leadError } = await supabase
          .from("leads")
          .insert(leadData)
          .select()
          .single();

        if (leadError) {
          console.error("❌ Failed to create lead:", leadError);
          // Don't fail the whole request if lead creation fails
          console.log("⚠️ Continuing without lead creation");
        } else {
          console.log("✅ Lead created:", lead.id);

          // Create initial lead interaction
          const interactionData = {
            lead_id: lead.id,
            interaction_type: "email",
            description: `Initial contact: ${message.substring(0, 100)}${message.length > 100 ? "..." : ""}`,
            interaction_date: new Date().toISOString(),
          };

          const { error: interactionError } = await supabase
            .from("lead_interactions")
            .insert(interactionData);

          if (interactionError) {
            console.error(
              "⚠️ Failed to create lead interaction:",
              interactionError
            );
          } else {
            console.log("✅ Lead interaction created");
          }
        }

        console.log("🎉 Brand contact processed successfully");
        return NextResponse.json({
          success: true,
          message:
            "Your message has been sent successfully! We'll get back to you soon.",
          data: {
            inquiryId: inquiry.id,
            leadId: lead?.id,
            brand: brand.name,
            estimatedValue: analysis.estimatedValue,
            priority: analysis.priority,
          },
        });
      } catch (error) {
        console.error("❌ Error processing brand contact:", error);
        return NextResponse.json(
          { error: "Failed to save your message" },
          { status: 500 }
        );
      }
    } else {
      // Handle general platform contact form
      const { name, email, subject, message } = body;

      // Validate required fields for general contact
      if (!name || !email || !subject || !message) {
        console.error("❌ Missing required fields for general contact:", {
          name: !!name,
          email: !!email,
          subject: !!subject,
          message: !!message,
        });
        return NextResponse.json(
          { error: "All fields are required" },
          { status: 400 }
        );
      }

      // For general platform contact, you might want to:
      // 1. Send an email to admin
      // 2. Store in a general inquiries table
      // 3. Create a support ticket

      console.log("📧 General platform contact:", { name, email, subject });

      // For now, just return success
      // You can implement email sending or admin notification here
      return NextResponse.json({
        success: true,
        message: "Thank you for contacting us! We'll get back to you soon.",
        type: "general_contact",
      });
    }
  } catch (error) {
    console.error("❌ Contact API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
