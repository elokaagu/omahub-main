import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { refreshNavigationCache } from "@/lib/services/categoryService";
import { syncProductCurrencies } from "@/lib/utils/currencySync";

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
        set(name: string, value: string, options: any) {
          // For API routes, we can't set cookies, so we'll just log this
          console.log(`🍪 Attempted to set cookie: ${name}`);
        },
        remove(name: string, options: any) {
          // For API routes, we can't remove cookies, so we'll just log this
          console.log(`🍪 Attempted to remove cookie: ${name}`);
        },
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📤 Received brand creation request:", {
      name: body.name,
      contact_email: body.contact_email,
      categories: body.categories,
      image: body.image ? "✅ Present" : "❌ Missing",
      bodyKeys: Object.keys(body),
    });

    // Debug: Log available cookies FIRST
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    console.log(
      "🍪 Available cookies:",
      allCookies.map((c) => ({ name: c.name, hasValue: !!c.value }))
    );

    // Create authenticated client
    const supabase = createAuthenticatedClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("🔐 User authenticated:", { id: user.id, email: user.email });

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    console.log("👤 User profile:", { role: profile?.role });

    if (!["admin", "super_admin"].includes(profile?.role)) {
      console.error("Insufficient permissions:", { userRole: profile?.role });
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Prepare brand data for insertion
    const brandData = {
      ...body,
      id: randomUUID(),
      rating: 5.0, // Default rating for new brands
    };

    console.log("💾 Inserting brand with data:", {
      id: brandData.id,
      name: brandData.name,
      contact_email: brandData.contact_email,
      location: brandData.location,
      category: brandData.category,
      categories: brandData.categories,
      image: brandData.image ? "✅ Present" : "❌ Missing",
    });

    // Create the brand
    const { data: newBrand, error: brandError } = await supabaseAdmin
      .from("brands")
      .insert(brandData)
      .select()
      .single();

    if (brandError) {
      console.error("❌ Database error creating brand:", {
        error: brandError,
        code: brandError.code,
        message: brandError.message,
        details: brandError.details,
        hint: brandError.hint,
      });
      return NextResponse.json(
        {
          error: "Failed to create brand",
          details: brandError.message,
          code: brandError.code,
        },
        { status: 500 }
      );
    }

    console.log("✅ Brand created successfully in database:", {
      id: newBrand.id,
      name: newBrand.name,
      contact_email: newBrand.contact_email,
    });

    // Auto-assign the new brand to all super admins
    console.log("🔄 Auto-assigning new brand to all super admins...");

    const { data: superAdmins, error: superAdminsError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, owned_brands")
      .eq("role", "super_admin");

    if (superAdminsError) {
      console.error("Error fetching super admins:", superAdminsError);
    } else if (superAdmins && superAdmins.length > 0) {
      // Update each super admin's owned_brands array
      for (const admin of superAdmins) {
        const currentBrands = admin.owned_brands || [];
        const updatedBrands = [...currentBrands, newBrand.id];

        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ owned_brands: updatedBrands })
          .eq("id", admin.id);

        if (updateError) {
          console.error(`Error updating admin ${admin.email}:`, updateError);
        } else {
          console.log(`✅ Added brand to admin: ${admin.email}`);
        }
      }
    }

    // Refresh navigation cache to update dropdowns
    console.log(
      "🔄 Refreshing navigation cache for new brand category:",
      newBrand.category
    );
    await refreshNavigationCache();

    // If the brand has a currency, sync any existing products to use it
    if (newBrand.currency) {
      console.log(`🔄 Brand created with currency ${newBrand.currency}, syncing any existing products...`);
      
      try {
        const syncResult = await syncProductCurrencies(newBrand.id, newBrand.currency);
        if (syncResult.success) {
          console.log(`✅ Successfully synced ${syncResult.updatedCount} existing products to currency ${newBrand.currency}`);
        } else {
          console.warn(`⚠️ Warning: Product currency sync failed: ${syncResult.error}`);
        }
      } catch (syncError) {
        console.warn("⚠️ Warning: Product currency sync failed:", syncError);
      }
    }

    console.log("✅ Brand created successfully:", newBrand.name);
    return NextResponse.json({ brand: newBrand }, { status: 201 });
  } catch (error) {
    console.error("Error in brand creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
