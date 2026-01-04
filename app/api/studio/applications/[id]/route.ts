import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { randomUUID } from "crypto";
import { randomBytes } from "crypto";
import { sendApplicationApprovalEmail, sendApplicationRejectionEmail } from "@/lib/services/emailService";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    const body = await request.json();
    const { status, notes } = body;

    console.log(`📝 Updating application ${id}:`, { status, notes });

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ["new", "reviewing", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
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

    // If approving or rejecting, fetch the full application data first
    let applicationData = null;
    if (status === "approved" || status === "rejected") {
      const { data: app, error: fetchError } = await supabase
        .from("designer_applications")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !app) {
        console.error("❌ Error fetching application:", fetchError);
        return NextResponse.json(
          { error: "Failed to fetch application data" },
          { status: 500 }
        );
      }

      applicationData = app;
      console.log(`📋 Fetched application data for ${status}:`, {
        brand_name: app.brand_name,
        email: app.email,
      });
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add notes if provided
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Add review metadata if status is changing from new
    if (status !== "new") {
      updateData.reviewed_at = new Date().toISOString();
      // Note: reviewed_by would be set here if we had the current user context
      // For now, we'll leave it null and can enhance this later
    }

    // Update the application
    const { data: updatedApplication, error } = await supabase
      .from("designer_applications")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating application:", error);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      );
    }

    console.log(`✅ Application ${id} updated successfully to status: ${status}`);

    // If approved, create brand and set up user access
    if (status === "approved" && applicationData) {
      try {
        console.log("🚀 Starting brand creation and user setup workflow...");
        
        const workflowResult = await setupBrandAndUserAccess(applicationData, supabase);
        
        if (!workflowResult.success) {
          console.error("❌ Brand/user setup failed:", workflowResult.error);
          // Don't fail the entire request, but log the error
          return NextResponse.json({
            success: true,
            application: updatedApplication,
            message: "Application approved, but brand/user setup encountered issues",
            warning: workflowResult.error,
            brandCreated: workflowResult.brandCreated || false,
            userCreated: workflowResult.userCreated || false,
          });
        }

        // Send approval email notification to the designer
        try {
          console.log("📧 Sending approval email notification to:", applicationData.email);
          console.log("📧 Email credentials:", {
            isNewUser: workflowResult.userCreated,
            hasTemporaryPassword: !!workflowResult.temporaryPassword,
            hasPasswordResetLink: !!workflowResult.passwordResetLink,
            temporaryPasswordPreview: workflowResult.temporaryPassword ? `${workflowResult.temporaryPassword.substring(0, 3)}...` : 'none',
          });
          
          const emailResult = await sendApplicationApprovalEmail({
            designerName: applicationData.designer_name,
            brandName: applicationData.brand_name,
            email: applicationData.email,
            temporaryPassword: workflowResult.temporaryPassword, // Always included for new users
            passwordResetLink: workflowResult.passwordResetLink, // Optional secure method
            isNewUser: workflowResult.userCreated || false,
          });

          if (emailResult.success) {
            console.log("✅ Approval email sent successfully");
          } else {
            console.warn("⚠️ Failed to send approval email:", emailResult.error);
            // Don't fail the request if email fails
          }
        } catch (emailError) {
          console.error("❌ Error sending approval email:", emailError);
          // Don't fail the request if email fails
        }

        return NextResponse.json({
          success: true,
          application: updatedApplication,
          message: "Application approved successfully. Brand and user access have been set up.",
          brand: workflowResult.brand,
          user: workflowResult.user ? { email: workflowResult.user.email, role: workflowResult.user.role } : null,
          temporaryPassword: workflowResult.temporaryPassword || null, // Show to admin as fallback
          passwordResetLink: workflowResult.passwordResetLink || null, // Primary secure method
          note: workflowResult.userCreated 
            ? (workflowResult.passwordResetLink 
                ? "Password reset link sent to user email. Temporary password available as fallback."
                : "Temporary password generated. Password reset link generation failed - user can use temporary password.")
            : null,
        });
      } catch (workflowError) {
        console.error("💥 Error in brand/user setup workflow:", workflowError);
        // Don't fail the entire request
        return NextResponse.json({
          success: true,
          application: updatedApplication,
          message: "Application approved, but brand/user setup encountered an error",
          warning: workflowError instanceof Error ? workflowError.message : "Unknown error",
        });
      }
    }

    // If rejected, send rejection email notification to the designer
    if (status === "rejected" && applicationData) {
      try {
        console.log("📧 Sending rejection email notification to:", applicationData.email);
        
        const emailResult = await sendApplicationRejectionEmail({
          designerName: applicationData.designer_name,
          brandName: applicationData.brand_name,
          email: applicationData.email,
          notes: notes || undefined,
        });

        if (emailResult.success) {
          console.log("✅ Rejection email sent successfully");
        } else {
          console.warn("⚠️ Failed to send rejection email:", emailResult.error);
          // Don't fail the request if email fails
        }
      } catch (emailError) {
        console.error("❌ Error sending rejection email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      application: updatedApplication,
      message: "Application updated successfully"
    });

  } catch (error) {
    console.error("💥 Error in application update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Sets up brand and user access when an application is approved
 */
async function setupBrandAndUserAccess(
  application: any,
  supabase: any
): Promise<{
  success: boolean;
  error?: string;
  brand?: any;
  user?: any;
  brandCreated?: boolean;
  userCreated?: boolean;
  temporaryPassword?: string;
  passwordResetLink?: string;
}> {
  try {
    // Step 1: Check if brand already exists (created during application submission)
    console.log("📦 Step 1: Checking for existing brand from application...");
    console.log("📋 Application data to map:", {
      brand_name: application.brand_name,
      email: application.email,
      phone: application.phone,
      website: application.website,
      instagram: application.instagram,
      location: application.location,
      category: application.category,
      year_founded: application.year_founded,
      description_length: application.description?.length || 0,
    });
    
    // Check if a brand already exists for this application (by name and email)
    const { data: existingBrand } = await supabase
      .from("brands")
      .select("*")
      .eq("name", application.brand_name)
      .eq("contact_email", application.email)
      .eq("is_verified", false) // Only match unverified brands (created during submission)
      .single();

    let newBrand;
    let brandId: string;
    let brandCreated = false;

    if (existingBrand) {
      // Brand already exists (was created during application submission)
      console.log("✅ Found existing brand (created during application submission):", {
        id: existingBrand.id,
        name: existingBrand.name,
        is_verified: existingBrand.is_verified,
      });
      newBrand = existingBrand;
      brandId = existingBrand.id;
      
      // Update the brand with any additional information from the application
      const brandUpdates: any = {
        description: application.description || existingBrand.description || "",
        long_description: application.description || existingBrand.long_description || "",
        location: application.location || existingBrand.location,
        category: application.category || existingBrand.category,
        categories: [application.category] || existingBrand.categories || [],
        website: application.website || existingBrand.website,
        instagram: application.instagram ? `@${application.instagram.replace(/^@/, "")}` : existingBrand.instagram,
        whatsapp: application.phone || existingBrand.whatsapp,
        founded_year: application.year_founded?.toString() || existingBrand.founded_year,
      };

      const { data: updatedBrand, error: updateError } = await supabase
        .from("brands")
        .update(brandUpdates)
        .eq("id", brandId)
        .select()
        .single();

      if (updateError) {
        console.warn("⚠️ Failed to update existing brand, but continuing:", updateError);
      } else if (updatedBrand) {
        newBrand = updatedBrand;
        console.log("✅ Brand updated with application data");
      }
    } else {
      // Brand doesn't exist, create it now
      console.log("🆕 Creating new brand (not found from application submission)...");
      brandId = randomUUID();
      const brandData = {
        id: brandId,
        name: application.brand_name,
        description: application.description || "",
        long_description: application.description || "",
        location: application.location,
        price_range: "explore brand for prices",
        currency: "USD", // Default currency, can be updated later
        category: application.category,
        categories: [application.category],
        rating: 5.0,
        is_verified: false,
        contact_email: application.email,
        website: application.website || undefined,
        instagram: application.instagram ? `@${application.instagram.replace(/^@/, "")}` : undefined,
        whatsapp: application.phone || undefined, // Map phone to whatsapp field
        founded_year: application.year_founded?.toString() || undefined,
      };

      const { data: createdBrand, error: brandError } = await supabase
        .from("brands")
        .insert(brandData)
        .select()
        .single();

      if (brandError) {
        console.error("❌ Error creating brand:", brandError);
        return {
          success: false,
          error: `Failed to create brand: ${brandError.message}`,
          brandCreated: false,
        };
      }

      newBrand = createdBrand;
      brandCreated = true;
      console.log("✅ Brand created successfully:", {
        id: newBrand.id,
        name: newBrand.name,
        contact_email: newBrand.contact_email,
        website: newBrand.website,
        instagram: newBrand.instagram,
        whatsapp: newBrand.whatsapp,
        location: newBrand.location,
        category: newBrand.category,
        founded_year: newBrand.founded_year,
      });
    }

    // Step 2: Check if user exists
    console.log("👤 Step 2: Checking if user exists...");
    
    let userId: string | null = null;
    let userCreated = false;
    let temporaryPassword: string | undefined = undefined;

    // First, check if profile exists (more efficient than listing all auth users)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", application.email)
      .single();

    if (existingProfile) {
      userId = existingProfile.id;
      console.log("✅ User profile already exists:", userId);
    } else {
      // Check if user exists in auth.users (profile might not exist yet)
      const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
      const authUser = existingAuthUser?.users?.find((u: any) => u.email === application.email);

      if (authUser) {
        userId = authUser.id;
        console.log("✅ User already exists in auth (but no profile):", userId);
      } else {
        // Create new auth user
        console.log("🆕 Creating new auth user...");
        
        // Generate a secure temporary password (as fallback for admin visibility)
        temporaryPassword = generateTemporaryPassword();
        
        const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
          email: application.email,
          password: temporaryPassword,
          email_confirm: true, // Auto-confirm email
        });

        if (createAuthError || !newAuthUser.user) {
          console.error("❌ Error creating auth user:", createAuthError);
          return {
            success: false,
            error: `Failed to create user account: ${createAuthError?.message || "Unknown error"}`,
            brandCreated: true,
            brand: newBrand,
            userCreated: false,
          };
        }

        userId = newAuthUser.user.id;
        userCreated = true;
        console.log("✅ Auth user created:", userId);
      }
    }

    // Step 3: Create or update profile
    console.log("📝 Step 3: Creating/updating user profile...");
    
    // Check if profile exists (by ID, not email, since we now have userId)
    const { data: profileById } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    let profile;
    if (profileById) {
      // Update existing profile
      console.log("🔄 Updating existing profile...");
      const currentOwnedBrands = profileById.owned_brands || [];
      const updatedOwnedBrands = currentOwnedBrands.includes(brandId)
        ? currentOwnedBrands
        : [...currentOwnedBrands, brandId];

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          role: "brand_admin",
          owned_brands: updatedOwnedBrands,
          email: application.email, // Ensure email is up to date
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Error updating profile:", updateError);
        return {
          success: false,
          error: `Failed to update profile: ${updateError.message}`,
          brandCreated: true,
          brand: newBrand,
          userCreated,
        };
      }

      profile = updatedProfile;
      console.log("✅ Profile updated successfully");
    } else {
      // Create new profile
      console.log("🆕 Creating new profile...");
      const { data: newProfile, error: createProfileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: application.email,
          role: "brand_admin",
          owned_brands: [brandId],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createProfileError) {
        console.error("❌ Error creating profile:", createProfileError);
        return {
          success: false,
          error: `Failed to create profile: ${createProfileError.message}`,
          brandCreated: true,
          brand: newBrand,
          userCreated,
        };
      }

      profile = newProfile;
      console.log("✅ Profile created successfully");
    }

    // Step 4: Verify the brand (set is_verified to true)
    console.log("✅ Step 4: Verifying brand...");
    const { error: verifyError } = await supabase
      .from("brands")
      .update({ is_verified: true })
      .eq("id", brandId);

    if (verifyError) {
      console.warn("⚠️ Failed to verify brand, but continuing:", verifyError);
    } else {
      console.log("✅ Brand verified successfully");
      // Update the brand object to reflect verification
      if (newBrand) {
        newBrand.is_verified = true;
      }
    }

    console.log("🎉 Brand and user setup completed successfully!");

    // Generate password reset link for new users (more secure than sending password)
    let passwordResetLink: string | undefined = undefined;
    if (userCreated && userId) {
      try {
        console.log("🔗 Generating password reset link for new user...");
        // Generate a password reset link that expires in 7 days
        const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}/reset-password`;
        const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: application.email,
          options: {
            redirectTo: resetUrl,
          }
        });

        if (resetError) {
          console.warn("⚠️ Failed to generate password reset link:", resetError);
          // Continue without reset link - temporary password will be used as fallback
        } else if (resetData?.properties?.action_link) {
          passwordResetLink = resetData.properties.action_link;
          console.log("✅ Password reset link generated successfully");
        }
      } catch (linkError) {
        console.warn("⚠️ Error generating password reset link:", linkError);
        // Continue without reset link - temporary password will be used as fallback
      }
    }

    return {
      success: true,
      brand: newBrand,
      user: profile,
      brandCreated: brandCreated, // Use the actual flag
      userCreated,
      temporaryPassword: userCreated ? temporaryPassword : undefined, // Keep for admin visibility
      passwordResetLink: passwordResetLink, // Primary method for user
    };
  } catch (error) {
    console.error("💥 Error in setupBrandAndUserAccess:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generates a secure temporary password
 */
function generateTemporaryPassword(): string {
  // Generate a random password with:
  // - 12 characters
  // - At least one uppercase letter
  // - At least one lowercase letter
  // - At least one number
  // - At least one special character
  
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  
  let password = "";
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = password.length; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split("").sort(() => Math.random() - 0.5).join("");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    
    console.log(`🗑️ [API] Deleting application:`, {
      id,
      idType: typeof id,
      idLength: id?.length,
      url: request.url,
      method: request.method
    });

    if (!id || id.trim() === '') {
      console.error("❌ [API] Invalid application ID provided:", { id });
      return NextResponse.json(
        { error: "Invalid application ID" },
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

    // First, check if the application exists (include status and email to find associated brand)
    console.log(`🔍 [API] Checking if application exists with ID:`, id);
    
    const { data: existingApplication, error: fetchError } = await supabase
      .from("designer_applications")
      .select("id, brand_name, designer_name, status, email")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("❌ [API] Error fetching application:", {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        searchedId: id
      });
      
      // If it's a "not found" error (PGRST116), return 404
      if (fetchError.code === "PGRST116") {
        console.warn(`⚠️ [API] Application not found (PGRST116) for ID:`, id);
        return NextResponse.json(
          { error: "Application not found" },
          { status: 404 }
        );
      }
      
      // Otherwise, it's a server error
      return NextResponse.json(
        { error: "Failed to fetch application", details: fetchError.message },
        { status: 500 }
      );
    }

    if (!existingApplication) {
      console.error("❌ [API] Application not found in database (no data returned):", id);
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    console.log(`✅ [API] Found application to delete:`, {
      id: existingApplication.id,
      brand_name: existingApplication.brand_name,
      designer_name: existingApplication.designer_name,
      status: existingApplication.status,
      email: existingApplication.email
    });

    // If the application is rejected, delete the associated brand
    let brandDeleted = false;
    if (existingApplication.status === "rejected" && existingApplication.brand_name && existingApplication.email) {
      console.log(`🗑️ [API] Application is rejected - checking for associated brand to delete...`);
      
      try {
        // Find the brand by name and email (matching how brands are created from applications)
        const { data: associatedBrand, error: brandFetchError } = await supabase
          .from("brands")
          .select("id, name, contact_email, is_verified")
          .eq("name", existingApplication.brand_name)
          .eq("contact_email", existingApplication.email)
          .maybeSingle();

        if (brandFetchError) {
          console.warn("⚠️ [API] Error fetching associated brand:", brandFetchError);
        } else if (associatedBrand) {
          // Check if there are other pending applications for this brand
          const { data: otherApplications, error: otherAppsError } = await supabase
            .from("designer_applications")
            .select("id")
            .eq("brand_name", existingApplication.brand_name)
            .eq("email", existingApplication.email)
            .neq("id", id)
            .neq("status", "approved");

          if (otherAppsError) {
            console.warn("⚠️ [API] Error checking for other applications:", otherAppsError);
          }

          // Only delete the brand if there are no other pending applications
          if (!otherApplications || otherApplications.length === 0) {
            console.log(`🗑️ [API] No other pending applications found - deleting brand:`, {
              id: associatedBrand.id,
              name: associatedBrand.name
            });

            const { error: brandDeleteError } = await supabase
              .from("brands")
              .delete()
              .eq("id", associatedBrand.id);

            if (brandDeleteError) {
              console.error("❌ [API] Error deleting associated brand:", brandDeleteError);
              // Don't fail the application deletion if brand deletion fails
            } else {
              brandDeleted = true;
              console.log(`✅ [API] Associated brand deleted successfully:`, associatedBrand.id);
            }
          } else {
            console.log(`⚠️ [API] Other pending applications exist for this brand - not deleting brand`);
          }
        } else {
          console.log(`ℹ️ [API] No associated brand found for this application`);
        }
      } catch (brandDeleteException) {
        console.error("❌ [API] Exception while attempting to delete brand:", brandDeleteException);
        // Don't fail the application deletion if brand deletion fails
      }
    }

    // Delete the application
    console.log(`🗑️ [API] Executing delete query for ID:`, id);
    
    const { error: deleteError, data: deleteResult } = await supabase
      .from("designer_applications")
      .delete()
      .eq("id", id)
      .select("id");

    if (deleteError) {
      console.error("❌ [API] Error deleting application:", {
        code: deleteError.code,
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
        id
      });
      return NextResponse.json(
        { error: "Failed to delete application", details: deleteError.message },
        { status: 500 }
      );
    }

    // Verify deletion was successful
    if (!deleteResult || deleteResult.length === 0) {
      console.warn("⚠️ [API] Delete operation returned no rows - application may have already been deleted");
      // Still return success since the goal (application deleted) is achieved
    } else {
      console.log(`✅ [API] Delete confirmed - removed ${deleteResult.length} row(s)`);
    }

    console.log(`✅ [API] Application ${id} deleted successfully${brandDeleted ? ' (brand also deleted)' : ''}`);

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
      deletedApplication: {
        id,
        brand_name: existingApplication.brand_name,
        designer_name: existingApplication.designer_name
      },
      brandDeleted: brandDeleted
    });

  } catch (error) {
    console.error("💥 Error in application delete API:", error);
    console.error("💥 Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
