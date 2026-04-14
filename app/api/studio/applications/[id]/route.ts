import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";
import { randomUUID } from "crypto";
import { randomBytes } from "crypto";
import { sendApplicationApprovalEmail, sendApplicationRejectionEmail } from "@/lib/services/emailService";
import { requireSuperAdmin } from "@/lib/auth/requireSuperAdmin";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const VALID_APPLICATION_STATUSES = ["new", "reviewing", "approved", "rejected"] as const;
const APPLICATION_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidApplicationId(id: unknown): id is string {
  return typeof id === "string" && APPLICATION_ID_REGEX.test(id.trim());
}

function normalizeNotes(notes: unknown): string | null | undefined {
  if (notes === undefined) return undefined;
  if (notes === null) return null;
  if (typeof notes !== "string") return undefined;
  const trimmed = notes.trim();
  return trimmed.length > 0 ? trimmed : "";
}

function normalizeApplicantEmail(email: unknown): string {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

/** Paginate through auth users — listUsers() defaults to a single page only. */
async function findAuthUserIdByEmail(
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>>,
  emailNorm: string
): Promise<string | null> {
  if (!emailNorm) return null;
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.error("❌ listUsers error:", error);
      return null;
    }
    const users = data?.users ?? [];
    const match = users.find(
      (u) => (u.email ?? "").trim().toLowerCase() === emailNorm
    );
    if (match?.id) return match.id;
    if (users.length < perPage) break;
  }
  return null;
}

async function broadcastProfileRefreshed(
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>>,
  profile: { id: string; email: string | null; role: string | null; owned_brands: unknown }
) {
  try {
    await supabase
      .channel(`profile_updates_${profile.id}`)
      .send({
        type: "broadcast",
        event: "profile_updated",
        payload: {
          user_id: profile.id,
          email: profile.email,
          role: profile.role,
          owned_brands: profile.owned_brands,
          updated_at: new Date().toISOString(),
          trigger: "application_approved",
        },
      });
  } catch (e) {
    console.warn("⚠️ Failed to broadcast profile update:", e);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authz = await requireSuperAdmin();
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id?.trim();
    if (!isValidApplicationId(id)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status, notes } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status values
    if (!VALID_APPLICATION_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const normalizedNotes = normalizeNotes(notes);
    if (notes !== undefined && normalizedNotes === undefined) {
      return NextResponse.json(
        { error: "Notes must be a string or null" },
        { status: 400 }
      );
    }
    if (typeof normalizedNotes === "string" && normalizedNotes.length > 2000) {
      return NextResponse.json(
        { error: "Notes must be 2000 characters or fewer" },
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
    }

    let approvalWorkflowResult: {
      success: boolean;
      error?: string;
      brand?: unknown;
      user?: unknown;
      brandCreated?: boolean;
      userCreated?: boolean;
      temporaryPassword?: string;
      passwordResetLink?: string;
    } | null = null;

    if (status === "approved" && applicationData) {
      try {
        approvalWorkflowResult = await setupBrandAndUserAccess(
          applicationData,
          supabase
        );
        if (!approvalWorkflowResult.success) {
          console.error(
            "❌ Brand/user setup failed:",
            approvalWorkflowResult.error
          );
          return NextResponse.json(
            {
              success: false,
              error:
                approvalWorkflowResult.error ||
                "Could not assign studio access or create the brand for this applicant. The application was not marked approved.",
            },
            { status: 422 }
          );
        }
      } catch (workflowError) {
        console.error("💥 Error in brand/user setup workflow:", workflowError);
        return NextResponse.json(
          {
            success: false,
            error:
              "Could not complete account provisioning for this application. The application was not marked approved.",
          },
          { status: 422 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add notes if provided
    if (notes !== undefined) {
      updateData.notes = normalizedNotes;
    }

    // Add review metadata if status is changing from new
    if (status !== "new") {
      updateData.reviewed_at = new Date().toISOString();
      updateData.reviewed_by = authz.userId;
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

    if (status === "approved" && applicationData && approvalWorkflowResult) {
      try {
        const emailResult = await sendApplicationApprovalEmail({
          designerName: applicationData.designer_name,
          brandName: applicationData.brand_name,
          email: applicationData.email,
          temporaryPassword: approvalWorkflowResult.temporaryPassword,
          passwordResetLink: approvalWorkflowResult.passwordResetLink,
          isNewUser: approvalWorkflowResult.userCreated || false,
        });

        if (!emailResult.success) {
          console.warn("⚠️ Failed to send approval email:", emailResult.error);
        }
      } catch (emailError) {
        console.error("❌ Error sending approval email:", emailError);
      }

      return NextResponse.json({
        success: true,
        application: updatedApplication,
        message:
          "Application approved successfully. Brand and user access have been set up.",
        brand: approvalWorkflowResult.brand,
        user: approvalWorkflowResult.user
          ? {
              email: (approvalWorkflowResult.user as { email?: string }).email,
              role: (approvalWorkflowResult.user as { role?: string }).role,
            }
          : null,
      });
    }

    // If rejected, send rejection email notification to the designer
    if (status === "rejected" && applicationData) {
      try {
        const emailResult = await sendApplicationRejectionEmail({
          designerName: applicationData.designer_name,
          brandName: applicationData.brand_name,
          email: applicationData.email,
          notes: notes || undefined,
        });

        if (!emailResult.success) {
          console.warn("⚠️ Failed to send rejection email:", emailResult.error);
        }
      } catch (emailError) {
        console.error("❌ Error sending rejection email:", emailError);
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
  application: Record<string, any>,
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>>
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
    const emailNorm = normalizeApplicantEmail(application.email);
    if (!emailNorm || !emailNorm.includes("@")) {
      return {
        success: false,
        error: "Invalid or missing applicant email on the application",
      };
    }

    const brandName =
      typeof application.brand_name === "string"
        ? application.brand_name.trim()
        : String(application.brand_name ?? "");

    // Step 1: Check if brand already exists (created during application submission)

    const { data: unverifiedBrandRows } = await supabase
      .from("brands")
      .select("*")
      .eq("name", brandName)
      .ilike("contact_email", emailNorm)
      .eq("is_verified", false)
      .limit(1);

    let existingBrand = unverifiedBrandRows?.[0] ?? null;

    if (!existingBrand) {
      const { data: anyBrandRows } = await supabase
        .from("brands")
        .select("*")
        .eq("name", brandName)
        .ilike("contact_email", emailNorm)
        .limit(1);
      existingBrand = anyBrandRows?.[0] ?? null;
    }

    let newBrand;
    let brandId: string;
    let brandCreated = false;

    if (existingBrand) {
      // Brand already exists (was created during application submission)
      newBrand = existingBrand;
      brandId = existingBrand.id;
      
      // Update the brand with any additional information from the application
      const brandUpdates: any = {
        description: application.description || existingBrand.description || "",
        long_description: application.description || existingBrand.long_description || "",
        location: application.location || existingBrand.location,
        category: application.category || existingBrand.category,
        categories:
          application.category
            ? [application.category]
            : existingBrand.categories || [],
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
      }
    } else {
      // Brand doesn't exist, create it now
      brandId = randomUUID();
      const brandData = {
        id: brandId,
        name: brandName,
        description: application.description || "",
        long_description: application.description || "",
        location: application.location,
        price_range: "explore brand for prices",
        currency: "USD", // Default currency, can be updated later
        category: application.category,
        categories: [application.category],
        rating: 5.0,
        is_verified: false,
        contact_email: emailNorm,
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
          error: "Failed to create brand record",
          brandCreated: false,
        };
      }

      newBrand = createdBrand;
      brandCreated = true;
    }

    // Step 2: Check if user exists

    let userId: string | null = null;
    let userCreated = false;
    let temporaryPassword: string | undefined = undefined;

    const { data: profileRows, error: profileLookupError } = await supabase
      .from("profiles")
      .select("id, role, owned_brands")
      .ilike("email", emailNorm)
      .limit(1);

    if (profileLookupError) {
      console.warn("⚠️ Error checking for existing profile:", profileLookupError);
    }

    const existingProfile = profileRows?.[0] ?? null;

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      const authId = await findAuthUserIdByEmail(supabase, emailNorm);

      if (authId) {
        userId = authId;
      } else {
        temporaryPassword = generateTemporaryPassword();

        const { data: newAuthUser, error: createAuthError } =
          await supabase.auth.admin.createUser({
            email: emailNorm,
            password: temporaryPassword,
            email_confirm: true,
          });

        if (createAuthError || !newAuthUser.user) {
          console.error("❌ Error creating auth user:", createAuthError);
          return {
            success: false,
          error: "Failed to create user account",
            brandCreated: true,
            brand: newBrand,
            userCreated: false,
          };
        }

        userId = newAuthUser.user.id;
        userCreated = true;
      }
    }

    if (!userId) {
      console.error("❌ Failed to find or create user - userId is null");
      return {
        success: false,
        error: "Failed to find or create user account",
        brandCreated: true,
        brand: newBrand,
        userCreated: false,
      };
    }

    // Step 3: Create or update profile - ALWAYS ensure user is brand_admin for this brand

    // Check if profile exists (by ID, not email, since we now have userId)
    const { data: profileById, error: profileFetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileFetchError) {
      console.error("❌ Error fetching profile by ID:", profileFetchError);
    }

    let profile;
    if (profileById) {
      // Update existing profile - ALWAYS add brand to owned_brands and ensure role is brand_admin

      const currentOwnedBrands = profileById.owned_brands || [];
      const brandAlreadyAssigned = currentOwnedBrands.includes(brandId);
      
      // Always add the brand if it's not already there
      const updatedOwnedBrands = brandAlreadyAssigned
        ? currentOwnedBrands
        : [...currentOwnedBrands, brandId];

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          role: "brand_admin", // Always ensure role is brand_admin
          owned_brands: updatedOwnedBrands,
          email: emailNorm, // Ensure email is up to date
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Error updating profile:", updateError);
        return {
          success: false,
          error: "Failed to update user profile",
          brandCreated: true,
          brand: newBrand,
          userCreated,
        };
      }

      profile = updatedProfile;
    } else {
      // Create new profile - ALWAYS set as brand_admin with this brand
      const { data: newProfile, error: createProfileError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: emailNorm,
          role: "brand_admin", // Always set as brand_admin
          owned_brands: [brandId], // Always include this brand
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createProfileError) {
        console.error("❌ Error creating profile:", createProfileError);
        return {
          success: false,
          error: "Failed to create user profile",
          brandCreated: true,
          brand: newBrand,
          userCreated,
        };
      }

      profile = newProfile;
    }

    // Final verification: Ensure the brand is in owned_brands
    if (!profile.owned_brands || !profile.owned_brands.includes(brandId)) {
      // Try to fix it
      const fixedOwnedBrands = [...(profile.owned_brands || []), brandId];
      const { error: fixError } = await supabase
        .from("profiles")
        .update({ owned_brands: fixedOwnedBrands })
        .eq("id", userId);
      
      if (fixError) {
        console.error("❌ Failed to fix owned_brands:", fixError);
      } else {
        profile.owned_brands = fixedOwnedBrands;
      }
    }

    await broadcastProfileRefreshed(supabase, {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      owned_brands: profile.owned_brands,
    });

    // Step 4: Verify the brand (set is_verified to true)
    const { error: verifyError } = await supabase
      .from("brands")
      .update({ is_verified: true })
      .eq("id", brandId);

    if (verifyError) {
      console.warn("⚠️ Failed to verify brand, but continuing:", verifyError);
    } else {
      // Update the brand object to reflect verification
      if (newBrand) {
        newBrand.is_verified = true;
      }
    }

    // Generate password reset link for new users (more secure than sending password)
    let passwordResetLink: string | undefined = undefined;
    if (userCreated && userId) {
      try {
        // Generate a password reset link that expires in 7 days
        const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}/reset-password`;
        const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email: emailNorm,
          options: {
            redirectTo: resetUrl,
          },
        });

        if (resetError) {
          console.warn("⚠️ Failed to generate password reset link:", resetError);
          // Continue without reset link - temporary password will be used as fallback
        } else if (resetData?.properties?.action_link) {
          passwordResetLink = resetData.properties.action_link;
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
      temporaryPassword: userCreated ? temporaryPassword : undefined,
      passwordResetLink: passwordResetLink,
    };
  } catch (error) {
    console.error("💥 Error in setupBrandAndUserAccess:", error);
    return {
      success: false,
      error: "Unable to complete brand/user setup",
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

  const pickFrom = (chars: string): string => {
    const index = randomBytes(1)[0] % chars.length;
    return chars[index];
  };

  const passwordChars: string[] = [
    pickFrom(uppercase),
    pickFrom(lowercase),
    pickFrom(numbers),
    pickFrom(special),
  ];

  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = passwordChars.length; i < 12; i++) {
    passwordChars.push(pickFrom(allChars));
  }

  // Fisher-Yates shuffle using cryptographic randomness
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join("");
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authz = await requireSuperAdmin();
    if (!authz.ok) {
      return NextResponse.json({ error: authz.error }, { status: authz.status });
    }

    // Handle both sync and async params (Next.js 15 compatibility)
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id?.trim();

    if (!isValidApplicationId(id)) {
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
    const { data: existingApplication, error: fetchError } = await supabase
      .from("designer_applications")
      .select("id, brand_name, designer_name, status, email")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("❌ [API] Error fetching application for deletion:", fetchError.code);
      
      // If it's a "not found" error (PGRST116), return 404
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Application not found" },
          { status: 404 }
        );
      }
      
      // Otherwise, it's a server error
      return NextResponse.json(
        { error: "Failed to fetch application" },
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

    // If the application is rejected, delete the associated brand
    let brandDeleted = false;
    if (existingApplication.status === "rejected" && existingApplication.brand_name && existingApplication.email) {
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
            const { error: brandDeleteError } = await supabase
              .from("brands")
              .delete()
              .eq("id", associatedBrand.id);

            if (brandDeleteError) {
              console.error("❌ [API] Error deleting associated brand:", brandDeleteError);
              // Don't fail the application deletion if brand deletion fails
            } else {
              brandDeleted = true;
            }
          }
        }
      } catch (brandDeleteException) {
        console.error("❌ [API] Exception while attempting to delete brand:", brandDeleteException);
        // Don't fail the application deletion if brand deletion fails
      }
    }

    // Delete the application
    const { error: deleteError, data: deleteResult } = await supabase
      .from("designer_applications")
      .delete()
      .eq("id", id)
      .select("id");

    if (deleteError) {
      console.error("❌ [API] Error deleting application:", deleteError.code);
      return NextResponse.json(
        { error: "Failed to delete application" },
        { status: 500 }
      );
    }

    // Verify deletion was successful
    if (!deleteResult || deleteResult.length === 0) {
      // Still return success since the goal (application deleted) is achieved
    }

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
