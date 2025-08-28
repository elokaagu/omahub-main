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

    if (profileError || profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    console.log("🔄 Starting super admin brand sync...");

    // Get all brands
    const { data: allBrands, error: brandsError } = await supabaseAdmin
      .from("brands")
      .select("id");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return NextResponse.json(
        { error: "Failed to fetch brands" },
        { status: 500 }
      );
    }

    const allBrandIds = allBrands.map((brand: { id: string }) => brand.id);
    console.log(`📦 Found ${allBrandIds.length} brands to assign`);

    // Get all super admins
    const { data: superAdmins, error: superAdminsError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, owned_brands")
      .eq("role", "super_admin");

    if (superAdminsError) {
      console.error("❌ Error fetching super admins:", superAdminsError);
      return NextResponse.json(
        { error: "Failed to fetch super admins" },
        { status: 500 }
      );
    }

    console.log(`👑 Found ${superAdmins.length} super admins to sync`);

    // Update each super admin to have all brands
    const updatePromises = superAdmins.map(async (admin) => {
      const currentBrands = admin.owned_brands || [];
      const missingBrands = allBrandIds.filter(
        (brandId) => !currentBrands.includes(brandId)
      );

      if (missingBrands.length === 0) {
        console.log(`✅ ${admin.email} already has all brands`);
        return { success: true, email: admin.email, added: 0 };
      }

      const updatedBrands = [...new Set([...currentBrands, ...allBrandIds])]; // Remove duplicates

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          owned_brands: updatedBrands,
          updated_at: new Date().toISOString(),
        })
        .eq("id", admin.id);

      if (updateError) {
        console.error(`❌ Error updating ${admin.email}:`, updateError);
        return {
          success: false,
          email: admin.email,
          error: updateError.message,
        };
      }

      console.log(
        `✅ Updated ${admin.email}: added ${missingBrands.length} brands`
      );
      return { success: true, email: admin.email, added: missingBrands.length };
    });

    const results = await Promise.allSettled(updatePromises);

    const summary = {
      totalSuperAdmins: superAdmins.length,
      totalBrands: allBrandIds.length,
      successful: 0,
      failed: 0,
      totalBrandsAdded: 0,
      details: [] as any[],
    };

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const value = result.value;
        summary.details.push(value);
        if (value.success) {
          summary.successful++;
          summary.totalBrandsAdded += value.added || 0;
        } else {
          summary.failed++;
        }
      } else {
        summary.failed++;
        summary.details.push({
          success: false,
          email: superAdmins[index]?.email || "unknown",
          error: result.reason,
        });
      }
    });

    console.log(
      `🎉 Sync complete: ${summary.successful}/${summary.totalSuperAdmins} super admins updated`
    );

    return NextResponse.json({
      message: "Super admin brand sync completed",
      summary,
    });
  } catch (error) {
    console.error("Error in super admin sync API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
