import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    console.log("📝 Designer application received:", formData);

    // Validate required fields
    if (!formData.brandName || !formData.designerName || !formData.email || !formData.location || !formData.category || !formData.description) {
      console.error("❌ Missing required fields:", {
        brandName: !!formData.brandName,
        designerName: !!formData.designerName,
        email: !!formData.email,
        location: !!formData.location,
        category: !!formData.category,
        description: !!formData.description
      });
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Prepare data for database insertion
    const applicationData = {
      brand_name: formData.brandName.trim(),
      designer_name: formData.designerName.trim(),
      email: formData.email.trim(),
      phone: formData.phone?.trim() || null,
      website: formData.website?.trim() || null,
      instagram: formData.instagram?.trim() || null,
      location: formData.location.trim(),
      category: formData.category.trim(),
      description: formData.description.trim(),
      year_founded: formData.yearFounded ? parseInt(formData.yearFounded) : null,
      status: "new" // Default status for new applications
    };

    console.log("📊 Inserting application data:", applicationData);

    // Insert into database
    const { data: application, error: insertError } = await supabase
      .from("designer_applications")
      .insert(applicationData)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Failed to insert application:", insertError);
      console.error("❌ Insert error details:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      return NextResponse.json(
        { 
          error: "Failed to submit application. Please try again.",
          details: insertError.message 
        },
        { status: 500 }
      );
    }

    if (!application) {
      console.error("❌ Application created but no data returned");
      return NextResponse.json(
        { error: "Application submitted but could not be verified. Please contact support." },
        { status: 500 }
      );
    }

    console.log("✅ Application submitted successfully:", {
      id: application.id,
      brand_name: application.brand_name,
      email: application.email,
      status: application.status,
      created_at: application.created_at,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      id: application.id,
      message: "Application submitted successfully! We'll review your portfolio and get back to you within 5-7 business days.",
      submittedFields: Object.keys(applicationData)
    });

  } catch (error) {
    console.error("💥 Error processing designer application:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
