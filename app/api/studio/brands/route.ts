import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to create authenticated supabase client
function createAuthenticatedClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Create authenticated client
    const supabase = createAuthenticatedClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !["admin", "super_admin"].includes(profile?.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Create the brand
    const { data: newBrand, error: brandError } = await supabaseAdmin
      .from("brands")
      .insert({
        ...body,
        id: randomUUID(),
        rating: 5.0, // Default rating for new brands
      })
      .select()
      .single();

    if (brandError) {
      console.error("Error creating brand:", brandError);
      return NextResponse.json(
        { error: "Failed to create brand" },
        { status: 500 }
      );
    }

    // Auto-assign the new brand to all super admins
    console.log("🔄 Auto-assigning new brand to all super admins...");

    const { data: superAdmins, error: superAdminsError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, owned_brands")
      .eq("role", "super_admin");

    if (superAdminsError) {
      console.error("❌ Error fetching super admins:", superAdminsError);
    } else if (superAdmins && superAdmins.length > 0) {
      // Update each super admin to include the new brand
      const updatePromises = superAdmins.map(async (admin) => {
        const currentBrands = admin.owned_brands || [];
        const updatedBrands = currentBrands.includes(newBrand.id)
          ? currentBrands
          : [...currentBrands, newBrand.id];

        return supabaseAdmin
          .from("profiles")
          .update({
            owned_brands: updatedBrands,
            updated_at: new Date().toISOString(),
          })
          .eq("id", admin.id);
      });

      const results = await Promise.allSettled(updatePromises);
      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;

      console.log(
        `✅ Auto-assigned new brand to ${successCount}/${superAdmins.length} super admins`
      );
    }

    return NextResponse.json({
      brand: newBrand,
      autoAssignedToSuperAdmins: superAdmins?.length || 0,
    });
  } catch (error) {
    console.error("Error in brand creation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
