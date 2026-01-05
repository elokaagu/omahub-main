import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { adminEmailServiceServer } from "@/lib/services/adminEmailService.server";
import { sendNewApplicationNotification, sendApplicationConfirmationEmail } from "@/lib/services/emailService";
import { randomUUID } from "crypto";

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

    // Create brand immediately so it's visible in the studio for approval
    console.log("📦 Creating brand from application data...");
    try {
      const brandId = randomUUID();
      const brandData = {
        id: brandId,
        name: application.brand_name,
        description: application.description || "",
        long_description: application.description || "",
        location: application.location,
        price_range: "explore brand for prices",
        currency: "USD",
        category: application.category,
        categories: [application.category],
        rating: 5.0,
        is_verified: false, // Brand is not verified until application is approved
        contact_email: application.email,
        website: application.website || undefined,
        instagram: application.instagram ? `@${application.instagram.replace(/^@/, "")}` : undefined,
        whatsapp: application.phone || undefined,
        founded_year: application.year_founded?.toString() || undefined,
      };

      const { data: newBrand, error: brandError } = await supabase
        .from("brands")
        .insert(brandData)
        .select()
        .single();

      if (brandError) {
        console.error("❌ Error creating brand:", brandError);
        // Don't fail the request - application is still saved
        // Admin can create brand manually if needed
        console.warn("⚠️ Brand creation failed, but application was saved. Brand can be created manually during approval.");
      } else {
        console.log("✅ Brand created successfully:", {
          id: newBrand.id,
          name: newBrand.name,
          is_verified: newBrand.is_verified,
        });

        // Update application with brand_id for reference (if we add this column later)
        // For now, we'll find the brand by name/email when approving
      }
    } catch (brandCreationError) {
      console.error("❌ Unexpected error creating brand:", brandCreationError);
      // Don't fail the request - application is still saved
    }

    // Send confirmation email to applicant
    try {
      console.log("📧 Sending confirmation email to applicant:", application.email);
      const confirmationResult = await sendApplicationConfirmationEmail({
        designerName: application.designer_name,
        brandName: application.brand_name,
        email: application.email,
      });
      
      if (confirmationResult.success) {
        console.log("✅ Application confirmation email sent to applicant");
      } else {
        console.warn("⚠️ Failed to send confirmation email to applicant:", confirmationResult.error);
        // Don't fail the request if email fails - application is still saved
      }
    } catch (confirmationEmailError) {
      console.error("❌ Error sending confirmation email to applicant:", confirmationEmailError);
      // Don't fail the request if email fails - application is still saved
    }

    // Send email notification to super admins
    try {
      console.log("📧 Fetching super admin emails for notification...");
      const superAdminEmails = await adminEmailServiceServer.getSuperAdminEmails();
      
      console.log(`📊 Retrieved ${superAdminEmails?.length || 0} super admin email(s) from database`);
      
      if (superAdminEmails && superAdminEmails.length > 0) {
        console.log(`📧 Super admin emails to notify:`, superAdminEmails);
        
        const emailResult = await sendNewApplicationNotification(application, superAdminEmails);
        
        if (emailResult.success) {
          console.log(`✅ Application notification sent to ${emailResult.successCount || 0} out of ${superAdminEmails.length} super admin(s)`);
          if (emailResult.failureCount && emailResult.failureCount > 0) {
            console.warn(`⚠️ ${emailResult.failureCount} email(s) failed to send. Check logs above for details.`);
          }
        } else {
          console.warn("⚠️ Failed to send application notification:", emailResult.error);
          if (emailResult.results) {
            console.warn("📋 Detailed results:", emailResult.results);
          }
          // Don't fail the request if email fails - application is still saved
        }
      } else {
        console.warn("⚠️ No super admin emails found - skipping notification");
        console.warn("💡 Check platform_settings table for 'super_admin_emails' key");
      }
    } catch (emailError) {
      console.error("❌ Error sending application notification:", emailError);
      console.error("❌ Error stack:", emailError instanceof Error ? emailError.stack : "No stack trace");
      // Don't fail the request if email fails - application is still saved
    }

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
