import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-unified";

// Helper function to extract project details from message
function analyzeInquiryMessage(message: string, inquiryType: string) {
  const lowerMessage = message.toLowerCase();

  // Estimate budget based on keywords and context
  let estimatedBudget = 2000; // Default
  let priority = "medium";
  let projectTimeline = "3-6 months";
  let tags = [inquiryType];

  // Budget estimation
  if (lowerMessage.includes("budget") || lowerMessage.includes("$")) {
    // Try to extract budget numbers
    const budgetMatch = message.match(/\$[\d,]+/);
    if (budgetMatch) {
      const budgetStr = budgetMatch[0].replace(/[$,]/g, "");
      estimatedBudget = parseInt(budgetStr);
    }
  }

  // Timeline analysis
  if (
    lowerMessage.includes("asap") ||
    lowerMessage.includes("urgent") ||
    lowerMessage.includes("soon")
  ) {
    projectTimeline = "ASAP";
    priority = "urgent";
  } else if (
    lowerMessage.includes("next month") ||
    lowerMessage.includes("4 weeks") ||
    lowerMessage.includes("6 weeks")
  ) {
    projectTimeline = "1-2 months";
    priority = "high";
  } else if (
    lowerMessage.includes("3 months") ||
    lowerMessage.includes("spring") ||
    lowerMessage.includes("summer")
  ) {
    projectTimeline = "2-3 months";
    priority = "high";
  } else if (
    lowerMessage.includes("fall") ||
    lowerMessage.includes("winter") ||
    lowerMessage.includes("next year")
  ) {
    projectTimeline = "6+ months";
    priority = "medium";
  }

  // Project type and tags analysis
  let projectType = inquiryType;

  if (lowerMessage.includes("wedding")) {
    projectType = "Wedding";
    tags.push("wedding");
    estimatedBudget = Math.max(estimatedBudget, 3000); // Weddings typically higher budget

    if (
      lowerMessage.includes("luxury") ||
      lowerMessage.includes("elegant") ||
      lowerMessage.includes("upscale")
    ) {
      tags.push("luxury");
      estimatedBudget = Math.max(estimatedBudget, 8000);
    }
    if (lowerMessage.includes("intimate") || lowerMessage.includes("small")) {
      tags.push("intimate");
      projectType = "Wedding - Intimate";
    }
    if (
      lowerMessage.includes("outdoor") ||
      lowerMessage.includes("garden") ||
      lowerMessage.includes("vineyard")
    ) {
      tags.push("outdoor");
      projectType = "Wedding - Outdoor";
    }
    if (lowerMessage.includes("destination")) {
      tags.push("destination");
      projectType = "Wedding - Destination";
      estimatedBudget = Math.max(estimatedBudget, 10000);
    }
  } else if (
    lowerMessage.includes("corporate") ||
    lowerMessage.includes("company") ||
    lowerMessage.includes("business")
  ) {
    projectType = "Corporate Event";
    tags.push("corporate");

    if (lowerMessage.includes("launch") || lowerMessage.includes("opening")) {
      projectType = "Corporate Launch";
      tags.push("launch");
    }
    if (lowerMessage.includes("gala") || lowerMessage.includes("fundraiser")) {
      projectType = "Corporate Gala";
      tags.push("gala");
      estimatedBudget = Math.max(estimatedBudget, 5000);
    }
  } else if (lowerMessage.includes("birthday")) {
    projectType = "Birthday Party";
    tags.push("birthday");
    if (lowerMessage.includes("surprise")) tags.push("surprise");
  } else if (lowerMessage.includes("anniversary")) {
    projectType = "Anniversary Celebration";
    tags.push("anniversary");
  }

  // Guest count analysis for budget estimation
  const guestMatch = message.match(/(\d+)\s*guests?/i);
  if (guestMatch) {
    const guestCount = parseInt(guestMatch[1]);
    if (guestCount > 200) {
      estimatedBudget = Math.max(estimatedBudget, 8000);
      tags.push("large-event");
    } else if (guestCount > 100) {
      estimatedBudget = Math.max(estimatedBudget, 5000);
      tags.push("medium-event");
    } else if (guestCount < 50) {
      tags.push("intimate");
    }
  }

  // Style preferences
  if (
    lowerMessage.includes("modern") ||
    lowerMessage.includes("contemporary")
  ) {
    tags.push("modern");
  }
  if (
    lowerMessage.includes("rustic") ||
    lowerMessage.includes("bohemian") ||
    lowerMessage.includes("boho")
  ) {
    tags.push("rustic");
  }
  if (lowerMessage.includes("romantic") || lowerMessage.includes("elegant")) {
    tags.push("romantic");
  }
  if (lowerMessage.includes("minimalist") || lowerMessage.includes("simple")) {
    tags.push("minimalist");
  }

  // Location analysis
  let location = "";
  const locationKeywords = [
    "new york",
    "ny",
    "california",
    "ca",
    "texas",
    "tx",
    "chicago",
    "portland",
    "san francisco",
    "austin",
    "napa",
    "hamptons",
  ];
  for (const keyword of locationKeywords) {
    if (lowerMessage.includes(keyword)) {
      location = keyword
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      break;
    }
  }

  return {
    estimatedBudget,
    estimatedProjectValue: Math.round(estimatedBudget * 1.1), // Add 10% for project value
    priority,
    projectType,
    projectTimeline,
    location,
    tags: [...new Set(tags)], // Remove duplicates
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Parse the request body
    const body = await request.json();
    const { name, email, message, brandId, brandName } = body;

    console.log("📧 Contact form submission:", {
      name,
      email,
      brandName,
      brandId,
    });

    // Validate required fields
    if (!name || !email || !message || !brandId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Verify the brand exists
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name")
      .eq("id", brandId)
      .single();

    if (brandError || !brand) {
      console.error("Brand not found:", brandError);
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Determine inquiry type and priority based on message content
    const lowerMessage = message.toLowerCase();
    let inquiryType = "general";
    let priority = "normal";

    if (lowerMessage.includes("wedding")) {
      inquiryType = "wedding";
      priority = "high";
    } else if (
      lowerMessage.includes("corporate") ||
      lowerMessage.includes("business") ||
      lowerMessage.includes("company")
    ) {
      inquiryType = "corporate";
      priority = "normal";
    } else if (lowerMessage.includes("birthday")) {
      inquiryType = "birthday";
    } else if (lowerMessage.includes("anniversary")) {
      inquiryType = "anniversary";
    } else if (lowerMessage.includes("graduation")) {
      inquiryType = "graduation";
    } else if (lowerMessage.includes("baby shower")) {
      inquiryType = "baby_shower";
    }

    // Create the inquiry in the database
    const inquiryData = {
      brand_id: brandId,
      customer_name: name,
      customer_email: email,
      subject: `New Contact from ${name}`,
      message: message,
      inquiry_type: inquiryType,
      priority: priority,
      status: "unread",
      source: "contact_form",
      created_at: new Date().toISOString(),
    };

    const { data: inquiry, error: insertError } = await supabase
      .from("inquiries")
      .insert(inquiryData)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating inquiry:", insertError);
      return NextResponse.json(
        { error: "Failed to save your message" },
        { status: 500 }
      );
    }

    console.log("✅ Inquiry created successfully:", inquiry.id);

    // Analyze the inquiry to create realistic lead data
    const leadAnalysis = analyzeInquiryMessage(message, inquiryType);

    // Create a lead automatically from this inquiry
    const leadData = {
      brand_id: brandId,
      customer_name: name,
      customer_email: email,
      lead_source: "contact_form",
      lead_status: "new",
      priority: leadAnalysis.priority,
      estimated_budget: leadAnalysis.estimatedBudget,
      estimated_project_value: leadAnalysis.estimatedProjectValue,
      project_type: leadAnalysis.projectType,
      project_timeline: leadAnalysis.projectTimeline,
      location: leadAnalysis.location,
      notes: `Initial inquiry via contact form. ${
        message.length > 200 ? message.substring(0, 200) + "..." : message
      }`,
      tags: leadAnalysis.tags,
      last_contact_date: new Date().toISOString(),
      next_follow_up_date: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(), // Follow up in 24 hours
      inquiry_id: inquiry.id,
      created_at: new Date().toISOString(),
    };

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      console.error("Error creating lead:", leadError);
      // Don't fail the whole request if lead creation fails
      console.log("⚠️ Inquiry created but lead creation failed");
    } else {
      console.log("✅ Lead created successfully:", lead.id);
      console.log("📊 Lead details:", {
        budget: leadAnalysis.estimatedBudget,
        timeline: leadAnalysis.projectTimeline,
        priority: leadAnalysis.priority,
        tags: leadAnalysis.tags,
      });
    }

    // Create initial lead interaction
    if (lead) {
      const interactionData = {
        lead_id: lead.id,
        interaction_type: "email",
        subject: "Initial contact form submission",
        description: `Customer submitted contact form inquiry. Project: ${leadAnalysis.projectType}. Timeline: ${leadAnalysis.projectTimeline}. Estimated budget: $${leadAnalysis.estimatedBudget}.`,
        outcome: "New lead created",
        next_action:
          "Send welcome email with portfolio and pricing information",
        created_at: new Date().toISOString(),
      };

      const { error: interactionError } = await supabase
        .from("lead_interactions")
        .insert(interactionData);

      if (interactionError) {
        console.error("Error creating lead interaction:", interactionError);
      } else {
        console.log("✅ Lead interaction created");
      }
    }

    // TODO: Send email notification to brand owner
    // This would integrate with your email service (SendGrid, Resend, etc.)
    console.log(`📨 Email notification needed for brand: ${brand.name}`);

    return NextResponse.json({
      success: true,
      message: `Your message to ${brand.name} has been sent successfully!`,
      inquiryId: inquiry.id,
      leadId: lead?.id,
      leadDetails: lead
        ? {
            estimatedBudget: leadAnalysis.estimatedBudget,
            projectType: leadAnalysis.projectType,
            timeline: leadAnalysis.projectTimeline,
            priority: leadAnalysis.priority,
          }
        : null,
    });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
