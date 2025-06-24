import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-unified";

// Helper function to extract project details from message
function analyzeInquiryMessage(
  message: string,
  inquiryType: string,
  brandCategory?: string
) {
  const lowerMessage = message.toLowerCase();

  // Base estimation by brand category
  let baseValue = 2000; // Default
  if (brandCategory) {
    switch (brandCategory.toLowerCase()) {
      case "luxury":
      case "haute couture":
        baseValue = 5000;
        break;
      case "bridal":
      case "wedding":
        baseValue = 4000;
        break;
      case "evening wear":
      case "formal":
        baseValue = 3000;
        break;
      case "ready-to-wear":
      case "contemporary":
        baseValue = 2500;
        break;
      case "accessories":
        baseValue = 1500;
        break;
      case "sustainable":
      case "ethical":
        baseValue = 2800;
        break;
      default:
        baseValue = 2000;
    }
  }

  let estimatedValue = baseValue;
  let priority = "normal";
  let projectTimeline = "3-6 months";
  let leadType = "inquiry";

  // Extract explicit budget if mentioned
  const budgetPatterns = [
    /\$[\d,]+/g, // $5,000
    /£[\d,]+/g, // £3,500
    /€[\d,]+/g, // €4,200
    /budget.*?(\d+)/gi, // budget of 3000
    /spend.*?(\d+)/gi, // willing to spend 2500
    /around.*?(\d+)/gi, // around 4000
    /up to.*?(\d+)/gi, // up to 5000
  ];

  for (const pattern of budgetPatterns) {
    const matches = message.match(pattern);
    if (matches) {
      for (const match of matches) {
        const budgetStr = match.replace(/[$£€,]/g, "").match(/\d+/);
        if (budgetStr) {
          const budgetNum = parseInt(budgetStr[0]);
          if (!isNaN(budgetNum) && budgetNum > 100) {
            // Reasonable minimum
            estimatedValue = Math.max(estimatedValue, budgetNum);
            break;
          }
        }
      }
    }
  }

  // Project type multipliers and adjustments
  const projectKeywords = {
    // High-value projects
    wedding: {
      multiplier: 2.5,
      minValue: 5000,
      priority: "high",
      type: "booking_intent",
    },
    bridal: {
      multiplier: 2.5,
      minValue: 4500,
      priority: "high",
      type: "booking_intent",
    },
    "red carpet": {
      multiplier: 3.0,
      minValue: 8000,
      priority: "urgent",
      type: "booking_intent",
    },
    gala: {
      multiplier: 2.2,
      minValue: 4000,
      priority: "high",
      type: "booking_intent",
    },

    // Corporate & Events
    corporate: {
      multiplier: 2.0,
      minValue: 4000,
      priority: "high",
      type: "booking_intent",
    },
    event: {
      multiplier: 1.8,
      minValue: 3000,
      priority: "high",
      type: "booking_intent",
    },
    party: {
      multiplier: 1.5,
      minValue: 2500,
      priority: "normal",
      type: "booking_intent",
    },
    photoshoot: {
      multiplier: 1.3,
      minValue: 1500,
      priority: "normal",
      type: "booking_intent",
    },

    // Custom work
    custom: {
      multiplier: 1.5,
      minValue: 2500,
      priority: "normal",
      type: "booking_intent",
    },
    bespoke: {
      multiplier: 1.8,
      minValue: 3000,
      priority: "normal",
      type: "booking_intent",
    },
    "made to measure": {
      multiplier: 1.6,
      minValue: 2800,
      priority: "normal",
      type: "booking_intent",
    },
    couture: {
      multiplier: 2.5,
      minValue: 5000,
      priority: "high",
      type: "booking_intent",
    },

    // Volume/Wholesale
    wholesale: {
      multiplier: 3.0,
      minValue: 10000,
      priority: "high",
      type: "quote_request",
    },
    bulk: {
      multiplier: 2.5,
      minValue: 8000,
      priority: "high",
      type: "quote_request",
    },
    collection: {
      multiplier: 2.0,
      minValue: 6000,
      priority: "normal",
      type: "quote_request",
    },

    // Services
    consultation: {
      multiplier: 0.3,
      minValue: 500,
      priority: "normal",
      type: "consultation",
    },
    styling: {
      multiplier: 0.8,
      minValue: 1200,
      priority: "normal",
      type: "consultation",
    },
    fitting: {
      multiplier: 0.4,
      minValue: 300,
      priority: "normal",
      type: "consultation",
    },

    // Information gathering
    quote: {
      multiplier: 1.0,
      minValue: baseValue,
      priority: "normal",
      type: "quote_request",
    },
    price: {
      multiplier: 1.0,
      minValue: baseValue,
      priority: "normal",
      type: "quote_request",
    },
    inquiry: {
      multiplier: 1.0,
      minValue: baseValue,
      priority: "normal",
      type: "inquiry",
    },
  };

  // Apply project-based adjustments
  for (const [keyword, config] of Object.entries(projectKeywords)) {
    if (lowerMessage.includes(keyword)) {
      estimatedValue = Math.max(
        estimatedValue * config.multiplier,
        config.minValue
      );
      priority = config.priority;
      leadType = config.type;
      break; // Use first match to avoid double-counting
    }
  }

  // Quantity indicators
  if (lowerMessage.includes("multiple") || lowerMessage.includes("several")) {
    estimatedValue *= 1.5;
  }
  if (lowerMessage.match(/\d+.*piece/i) || lowerMessage.match(/\d+.*item/i)) {
    const quantityMatch = lowerMessage.match(
      /(\d+).*(?:piece|item|dress|suit|gown)/i
    );
    if (quantityMatch) {
      const quantity = parseInt(quantityMatch[1]);
      if (quantity > 1 && quantity <= 20) {
        estimatedValue *= Math.min(quantity, 5); // Cap multiplier at 5x
      }
    }
  }

  // Timeline urgency affects priority and sometimes value
  if (
    lowerMessage.includes("urgent") ||
    lowerMessage.includes("asap") ||
    lowerMessage.includes("rush")
  ) {
    projectTimeline = "ASAP";
    priority = "urgent";
    estimatedValue *= 1.3; // Rush job premium
  } else if (
    lowerMessage.includes("next week") ||
    lowerMessage.includes("this month")
  ) {
    projectTimeline = "1-3 months";
    priority = "high";
    estimatedValue *= 1.1; // Slight premium for quick turnaround
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

  // Quality/luxury indicators
  const luxuryKeywords = [
    "luxury",
    "premium",
    "high-end",
    "exclusive",
    "designer",
    "couture",
  ];
  if (luxuryKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    estimatedValue *= 1.4;
    if (priority === "normal") priority = "high";
  }

  // Budget constraints (reduce estimates)
  const budgetConstraints = [
    "budget",
    "affordable",
    "reasonable",
    "cost-effective",
    "economical",
  ];
  if (
    budgetConstraints.some((keyword) => lowerMessage.includes(keyword)) &&
    !lowerMessage.includes("no budget") &&
    !lowerMessage.includes("unlimited")
  ) {
    estimatedValue *= 0.8;
  }

  // Round to reasonable increments
  if (estimatedValue < 1000) {
    estimatedValue = Math.round(estimatedValue / 50) * 50; // Round to nearest $50
  } else if (estimatedValue < 5000) {
    estimatedValue = Math.round(estimatedValue / 100) * 100; // Round to nearest $100
  } else {
    estimatedValue = Math.round(estimatedValue / 250) * 250; // Round to nearest $250
  }

  // Ensure minimum reasonable value
  estimatedValue = Math.max(estimatedValue, 200);

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
      const analysis = analyzeInquiryMessage(
        message,
        "general",
        brand.category
      );

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

        // Create lead with intelligent analysis
        const { data: lead, error: leadError } = await supabase
          .from("leads")
          .insert({
            brand_id: brandId,
            customer_name: name,
            customer_email: email,
            source: "website",
            status: "new",
            priority: analysis.priority,
            lead_type: analysis.leadType,
            estimated_value: analysis.estimatedValue,
            notes: `Original message: ${message}`,
          })
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
