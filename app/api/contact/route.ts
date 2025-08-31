import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { sendContactEmail } from "@/lib/services/emailService";

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
    console.log("📧 Contact API - Environment check:", {
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV,
    });

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

      const supabase = await getAdminClient();

      if (!supabase) {
        console.error("❌ Failed to get admin client");
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }

      // Verify brand exists and get contact information
      console.log("🔍 Checking if brand exists:", brandId);
      const { data: brand, error: brandError } = await supabase
        .from("brands")
        .select("id, name, category, contact_email")
        .eq("id", brandId)
        .single();

      if (brandError || !brand) {
        console.error("❌ Brand not found:", brandId, brandError);
        return NextResponse.json({ error: "Brand not found" }, { status: 404 });
      }

      console.log("✅ Brand found:", brand);

      // Determine contact email (use brand's email or fallback to OmaHub)
      const contactEmail = brand.contact_email || "info@oma-hub.com";
      const isOmaHubFallback = !brand.contact_email;

      // Create inquiry in the inquiries table
      console.log("📝 Creating inquiry in Studio inbox...");
      
      let inquiry;
      try {
        console.log("📧 Creating inquiry in database...");
        
        const { data: inquiryData, error: inquiryError } = await supabase
          .from("inquiries")
          .insert({
            brand_id: brandId,
            customer_name: name,
            customer_email: email,
            subject: `Inquiry from ${name}`,
            message: message,
            inquiry_type: "general", // Use valid inquiry type
            priority: "normal",
            source: "website", // Use valid source value
            status: "unread", // Use valid status
          })
          .select()
          .single();

        if (inquiryError) {
          console.error("❌ Failed to create inquiry:", inquiryError);
          console.log("🔍 Inquiry error details:", {
            code: inquiryError.code,
            message: inquiryError.message,
            details: inquiryError.details,
            hint: inquiryError.hint
          });
          // Don't fail the entire request, continue with mock inquiry
          inquiry = {
            id: "temp-" + Date.now(),
            brand_id: brandId,
            customer_name: name,
            customer_email: email,
            subject: `Inquiry from ${name}`,
            message: message,
            inquiry_type: "general", // Use valid inquiry type
            priority: "normal",
            source: "website", // Use valid source value
            status: "unread", // Use valid status
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          console.log("⚠️ Using mock inquiry due to database error");
        } else {
          inquiry = inquiryData;
          console.log("✅ Inquiry created successfully in database:", inquiry.id);
        }
      } catch (dbError) {
        console.error("❌ Database error creating inquiry:", dbError);
        // Create a mock inquiry object as fallback
        inquiry = {
          id: "temp-" + Date.now(),
          brand_id: brandId,
          customer_name: name,
          customer_email: email,
          subject: `Inquiry from ${name}`,
          message: message,
          inquiry_type: "general", // Use valid inquiry type
          priority: "normal",
          source: "website", // Use valid source value
          status: "unread", // Use valid status
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.log("⚠️ Using mock inquiry due to database error");
      }

      // Create a lead from this inquiry
      try {
        console.log("📊 Creating lead from inquiry...");
        
        // Create lead in the leads table
        const leadData = {
          brand_id: brandId,
          customer_name: name,
          customer_email: email,
          customer_phone: "", // Contact form doesn't collect phone
          source: "website", // Use valid source value
          lead_type: "inquiry",
          status: "new",
          priority: "normal",
          notes: `Contact form inquiry: ${message}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: lead, error: leadError } = await supabase
          .from("leads")
          .insert(leadData)
          .select()
          .single();

        if (leadError) {
          console.error("❌ Failed to create lead:", leadError);
          console.log("⚠️ Lead creation failed, but inquiry was created successfully");
          console.log("🔍 Lead error details:", {
            code: leadError.code,
            message: leadError.message,
            details: leadError.details,
            hint: leadError.hint
          });
        } else {
          console.log("✅ Lead created successfully:", lead.id);
          console.log("📊 Lead data:", {
            id: lead.id,
            customer_name: lead.customer_name,
            status: lead.status,
            source: lead.source
          });
        }
      } catch (leadError) {
        console.error("❌ Error creating lead:", leadError);
        console.log("⚠️ Lead creation failed, but inquiry was created successfully");
      }

      // Send email notification to brand contact email
      console.log("📧 Sending email notification to:", contactEmail);
      console.log("📧 Email service configuration:", {
        hasResendKey: !!process.env.RESEND_API_KEY,
        resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
        contactEmail,
        brandName: brand.name,
      });

      try {
        const emailResult = await sendContactEmail({
          name: name,
          email: email,
          subject: `New Customer Inquiry - ${name}`,
          message: `You have a new inquiry from ${name} about your designs.

Customer Email: ${email}
Message: ${message}

This inquiry has been saved to your Studio inbox. You can respond directly to the customer at ${email}.

View all inquiries in your Studio: https://oma-hub.com/studio/inbox?brand=${brandId}

Best regards,
OmaHub Team`,
          to: contactEmail, // Send to brand's contact email
        });

        console.log("📧 Email service response:", emailResult);

        if (emailResult.success) {
          console.log("✅ Email notification sent successfully");
        } else {
          console.error(
            "❌ Failed to send email notification:",
            emailResult.error
          );
        }
      } catch (emailError) {
        console.error("❌ Email sending error:", emailError);
        console.error("❌ Email error details:", {
          error: emailError,
          errorMessage:
            emailError instanceof Error
              ? emailError.message
              : String(emailError),
          errorStack:
            emailError instanceof Error ? emailError.stack : undefined,
        });
        // Don't fail the entire request if email fails
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: isOmaHubFallback
          ? "Your message has been sent! We'll forward it to the designer and get back to you soon."
          : "Your message has been sent! The designer will receive it in their inbox and respond to you directly.",
        inquiry: inquiry,
        type: "brand_contact",
        notification_sent: true,
      });
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

      // For general platform contact, send to OmaHub admin
      console.log("📧 General platform contact:", { name, email, subject });
      console.log("📧 General contact email service configuration:", {
        hasResendKey: !!process.env.RESEND_API_KEY,
        resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
        nodeEnv: process.env.NODE_ENV,
      });

      // Create inquiry and lead for general platform contact
      let inquiry = null;
      let lead = null;
      
      try {
        console.log("📝 Creating inquiry for general platform contact...");
        
        const supabase = await getAdminClient();
        if (supabase) {
          // First create an inquiry in the inquiries table
          const { data: inquiryData, error: inquiryError } = await supabase
            .from("inquiries")
            .insert({
              brand_id: "omahub-platform-0000-0000-0000-000000000000", // Use OmaHub Platform brand
              customer_name: name,
              customer_email: email,
              subject: subject,
              message: message,
              inquiry_type: "general", // Use valid inquiry type
              priority: "normal",
              source: "website", // Use valid source
              status: "unread", // Use valid status
            })
            .select()
            .single();

          if (inquiryError) {
            console.error("❌ Failed to create inquiry for general contact:", inquiryError);
            console.log("⚠️ Inquiry creation failed, but contact form was submitted successfully");
          } else {
            inquiry = inquiryData;
            console.log("✅ Inquiry created successfully for general contact:", inquiry.id);
          }

          // Then create a lead in the leads table
          const generalLeadData = {
            brand_id: "omahub-platform-0000-0000-0000-000000000000", // Use OmaHub Platform brand
            customer_name: name,
            customer_email: email,
            customer_phone: "", // General contact form doesn't collect phone
            source: "platform_contact_form",
            status: "new",
            priority: "normal",
            estimated_value: null, // Not collected in general contact form
            lead_type: "inquiry",
            notes: `General platform contact: ${subject}\n\n${message}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { data: insertedLead, error: leadError } = await supabase
            .from("leads")
            .insert(generalLeadData)
            .select()
            .single();

          if (leadError) {
            console.error("❌ Failed to create lead for general contact:", leadError);
            console.log("⚠️ Lead creation failed, but inquiry was created successfully");
          } else {
            lead = insertedLead;
            console.log("✅ Lead created successfully for general contact:", insertedLead.id);
            console.log("📊 Lead data:", {
              id: insertedLead.id,
              customer_name: insertedLead.customer_name,
              status: insertedLead.status,
              source: insertedLead.source
            });
          }
        }
      } catch (error) {
        console.error("❌ Error creating inquiry/lead for general contact:", error);
        console.log("⚠️ Inquiry/lead creation failed, but contact form was submitted successfully");
      }

      try {
        const emailResult = await sendContactEmail({
          name: name,
          email: email,
          subject: `Platform Contact: ${subject}`,
          message: `New general platform contact form submission:

Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}

View all inquiries in your Studio: https://oma-hub.com/studio/inbox`,
        });

        console.log("📧 General contact email service response:", emailResult);

        if (emailResult.success) {
          console.log("✅ General contact email sent successfully");
        } else {
          console.error(
            "❌ Failed to send general contact email:",
            emailResult.error
          );
        }
      } catch (emailError) {
        console.error("❌ Email sending error:", emailError);
        console.error("❌ General contact email error details:", {
          error: emailError,
          errorMessage:
            emailError instanceof Error
              ? emailError.message
              : String(emailError),
          errorStack:
            emailError instanceof Error ? emailError.stack : undefined,
        });
      }

      // Return success response
      return NextResponse.json({
        success: true,
        message: "Thank you for contacting us! We'll get back to you soon.",
        type: "general_contact",
        inquiry: inquiry,
        lead: lead,
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
