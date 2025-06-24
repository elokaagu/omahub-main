import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();

    const {
      brandId,
      brandName,
      customerName,
      customerEmail,
      message,
      customerPhone,
      source = "website",
    } = body;

    console.log("📧 Contact designer request:", {
      brandId, brandName, customerName, customerEmail, source
    });

    // Validate required fields
    if (!brandId || !customerName || !customerEmail || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create inquiry
    const { data: inquiry, error: insertError } = await supabase
      .from("inquiries")
      .insert({
        brand_id: brandId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        subject: `Contact from ${customerName} via OmaHub`,
        message: message,
        inquiry_type: "general",
        priority: "normal",
        source: source,
        status: "unread",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating inquiry:", insertError);
      return NextResponse.json(
        { error: "Failed to create inquiry" },
        { status: 500 }
      );
    }

    // Also create a lead
    const { data: lead } = await supabase
      .from("leads")
      .insert({
        brand_id: brandId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        source: source,
        lead_type: "inquiry",
        status: "new",
        priority: "normal",
        estimated_value: 75000,
        notes: `Contact via OmaHub: ${message}`,
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully!",
      inquiry: inquiry,
      lead: lead,
    });
  } catch (error) {
    console.error("Contact designer API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
