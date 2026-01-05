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
    // Parse year_founded safely - handle empty strings and invalid values
    let yearFounded: number | null = null;
    if (formData.yearFounded && formData.yearFounded.trim()) {
      const parsed = parseInt(formData.yearFounded.trim(), 10);
      if (!isNaN(parsed) && parsed > 0) {
        yearFounded = parsed;
      }
    }

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
      year_founded: yearFounded,
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
      console.log("📧 [CONFIRMATION EMAIL] Starting confirmation email process...");
      console.log("📧 [CONFIRMATION EMAIL] Application data:", {
        designerName: application.designer_name,
        brandName: application.brand_name,
        email: application.email,
      });
      
      const confirmationResult = await sendApplicationConfirmationEmail({
        designerName: application.designer_name,
        brandName: application.brand_name,
        email: application.email,
      });
      
      console.log("📊 [CONFIRMATION EMAIL] Email result:", {
        success: confirmationResult.success,
        hasError: !!confirmationResult.error,
        error: confirmationResult.error,
        hasData: !!confirmationResult.data,
        dataId: confirmationResult.data?.id,
      });
      
      if (confirmationResult.success) {
        console.log("✅ [CONFIRMATION EMAIL] Application confirmation email sent successfully to applicant:", application.email);
        console.log("✅ [CONFIRMATION EMAIL] Email ID:", confirmationResult.data?.id);
      } else {
        console.error("❌ [CONFIRMATION EMAIL] Failed to send confirmation email to applicant:", application.email);
        console.error("❌ [CONFIRMATION EMAIL] Error details:", confirmationResult.error);
        // Don't fail the request if email fails - application is still saved
      }
    } catch (confirmationEmailError) {
      console.error("❌ [CONFIRMATION EMAIL] Exception sending confirmation email to applicant:", application.email);
      console.error("❌ [CONFIRMATION EMAIL] Error type:", confirmationEmailError instanceof Error ? confirmationEmailError.constructor.name : typeof confirmationEmailError);
      console.error("❌ [CONFIRMATION EMAIL] Error message:", confirmationEmailError instanceof Error ? confirmationEmailError.message : String(confirmationEmailError));
      console.error("❌ [CONFIRMATION EMAIL] Error stack:", confirmationEmailError instanceof Error ? confirmationEmailError.stack : "No stack trace");
      // Don't fail the request if email fails - application is still saved
    }

    // Send email notification to super admins
    // IMPORTANT: This must happen regardless of brand creation success
    try {
      console.log("📧 [SUPER ADMIN EMAIL] Starting notification process...");
      console.log("📧 [SUPER ADMIN EMAIL] Application object:", {
        id: application.id,
        brand_name: application.brand_name,
        designer_name: application.designer_name,
        email: application.email,
        has_phone: !!application.phone,
        has_website: !!application.website,
        has_instagram: !!application.instagram,
        has_year_founded: !!application.year_founded,
        location: application.location,
        category: application.category,
        has_description: !!application.description,
        created_at: application.created_at
      });
      
      console.log("📧 [SUPER ADMIN EMAIL] Fetching super admin emails for notification...");
      
      const superAdminEmails = await adminEmailServiceServer.getSuperAdminEmails();
      
      console.log(`📊 [SUPER ADMIN EMAIL] Retrieved ${superAdminEmails?.length || 0} super admin email(s) from database`);
      console.log(`📋 [SUPER ADMIN EMAIL] Email list:`, superAdminEmails);
      console.log(`📋 [SUPER ADMIN EMAIL] Email list type:`, typeof superAdminEmails);
      console.log(`📋 [SUPER ADMIN EMAIL] Is array:`, Array.isArray(superAdminEmails));
      
      if (!superAdminEmails || !Array.isArray(superAdminEmails) || superAdminEmails.length === 0) {
        console.error("❌ [SUPER ADMIN EMAIL] No super admin emails found - skipping notification");
        console.error("💡 [SUPER ADMIN EMAIL] Check platform_settings table for 'super_admin_emails' key");
        console.error("💡 [SUPER ADMIN EMAIL] Using fallback emails if database query failed");
      } else {
        console.log(`✅ [SUPER ADMIN EMAIL] Found ${superAdminEmails.length} super admin email(s) to notify:`, superAdminEmails);
        
        // Ensure application object has all required fields for email
        const emailApplicationData = {
          id: application.id,
          brand_name: application.brand_name || "",
          designer_name: application.designer_name || "",
          email: application.email || "",
          phone: application.phone || undefined,
          website: application.website || undefined,
          instagram: application.instagram || undefined,
          location: application.location || "",
          category: application.category || "",
          description: application.description || "",
          year_founded: application.year_founded || undefined,
          created_at: application.created_at || new Date().toISOString(),
        };
        
        console.log("📧 [SUPER ADMIN EMAIL] Calling sendNewApplicationNotification with data:", emailApplicationData);
        const emailResult = await sendNewApplicationNotification(emailApplicationData, superAdminEmails);
        
        console.log("📊 [SUPER ADMIN EMAIL] Email result:", {
          success: emailResult.success,
          successCount: emailResult.successCount,
          failureCount: emailResult.failureCount,
          error: emailResult.error,
          hasResults: !!emailResult.results,
          resultsLength: emailResult.results?.length || 0
        });
        
        if (emailResult.success) {
          console.log(`✅ [SUPER ADMIN EMAIL] Application notification sent to ${emailResult.successCount || 0} out of ${superAdminEmails.length} super admin(s)`);
          if (emailResult.failureCount && emailResult.failureCount > 0) {
            console.warn(`⚠️ [SUPER ADMIN EMAIL] ${emailResult.failureCount} email(s) failed to send. Check logs above for details.`);
            if (emailResult.results) {
              const failedEmails = emailResult.results.filter(r => !r.success);
              console.warn(`⚠️ [SUPER ADMIN EMAIL] Failed emails:`, failedEmails);
            }
          }
        } else {
          console.error("❌ [SUPER ADMIN EMAIL] Failed to send application notification:", emailResult.error);
          if (emailResult.results) {
            console.error("❌ [SUPER ADMIN EMAIL] Detailed results:", JSON.stringify(emailResult.results, null, 2));
          }
          // Don't fail the request if email fails - application is still saved
        }
      }
    } catch (emailError) {
      console.error("❌ [SUPER ADMIN EMAIL] Error sending application notification:", emailError);
      console.error("❌ [SUPER ADMIN EMAIL] Error type:", emailError instanceof Error ? emailError.constructor.name : typeof emailError);
      console.error("❌ [SUPER ADMIN EMAIL] Error message:", emailError instanceof Error ? emailError.message : String(emailError));
      console.error("❌ [SUPER ADMIN EMAIL] Error stack:", emailError instanceof Error ? emailError.stack : "No stack trace");
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
