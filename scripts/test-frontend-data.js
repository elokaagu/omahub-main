const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simulate the permissions service logic
const BRAND_ADMIN_EMAILS = ["eloka@culturin.com"];

function isBrandAdminEmail(email) {
  return BRAND_ADMIN_EMAILS.includes(email);
}

function getUserPermissions(userId, email) {
  const permissions = [];

  if (isBrandAdminEmail(email)) {
    permissions.push(
      "studio.access",
      "studio.brands.manage",
      "studio.collections.manage"
    );
  }

  return permissions;
}

async function testFrontendData() {
  try {
    console.log("🧪 Testing Frontend Data Flow for eloka@culturin.com...\n");

    // Step 1: Get user profile (simulate what frontend does)
    console.log("1. Fetching user profile...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "eloka@culturin.com")
      .single();

    if (profileError) {
      console.error("❌ Profile error:", profileError);
      return;
    }

    console.log("✅ Profile found:", {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      owned_brands: profile.owned_brands,
    });

    // Step 2: Get permissions (simulate permissions service)
    console.log("\n2. Getting user permissions...");
    const permissions = getUserPermissions(profile.id, profile.email);
    console.log("✅ Permissions:", permissions);

    // Step 3: Check role-based access
    console.log("\n3. Checking role-based access...");
    const isBrandOwner = profile.role === "brand_admin";
    const isAdmin = profile.role === "admin" || profile.role === "super_admin";
    const ownedBrandIds = profile.owned_brands || [];
    const canManageBrands = permissions.includes("studio.brands.manage");

    console.log("✅ Access checks:", {
      isBrandOwner,
      isAdmin,
      ownedBrandIds,
      canManageBrands,
    });

    // Step 4: Fetch all brands (simulate getAllBrands)
    console.log("\n4. Fetching all brands...");
    const { data: allBrands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, category, location")
      .order("name");

    if (brandsError) {
      console.error("❌ Brands error:", brandsError);
      return;
    }

    console.log(`✅ All brands fetched: ${allBrands.length}`);

    // Step 5: Filter brands by ownership (simulate filterBrandsByOwnership)
    console.log("\n5. Filtering brands by ownership...");

    let filteredBrands = [];

    if (isAdmin) {
      filteredBrands = allBrands; // Admins see all brands
      console.log("👑 Admin access: showing all brands");
    } else if (isBrandOwner && ownedBrandIds.length > 0) {
      filteredBrands = allBrands.filter((brand) =>
        ownedBrandIds.includes(brand.id)
      );
      console.log(
        `🏷️ Brand owner access: filtering by owned brands [${ownedBrandIds.join(", ")}]`
      );
    } else {
      filteredBrands = []; // No access for other roles
      console.log("🚫 No access for this role");
    }

    console.log(`✅ Filtered brands: ${filteredBrands.length}`);

    if (filteredBrands.length > 0) {
      console.log("📋 Brands user should see:");
      filteredBrands.forEach((brand) => {
        console.log(`   - ${brand.name} (${brand.id})`);
      });
    } else {
      console.log("❌ No brands to display!");

      // Debug: Check if the brand exists
      console.log("\n🔍 Debug: Checking if ehbs-couture exists...");
      const ehbsBrand = allBrands.find((brand) => brand.id === "ehbs-couture");
      if (ehbsBrand) {
        console.log("✅ ehbs-couture brand exists:", ehbsBrand);
        console.log("🔍 Checking if it's in owned_brands array...");
        console.log("   owned_brands:", ownedBrandIds);
        console.log(
          "   includes ehbs-couture:",
          ownedBrandIds.includes("ehbs-couture")
        );
      } else {
        console.log("❌ ehbs-couture brand not found in database");
      }
    }

    // Step 6: Simulate what BrandManagement component should receive
    console.log("\n6. What BrandManagement component should receive:");
    console.log({
      user: { id: profile.id, email: profile.email },
      isBrandOwner,
      isAdmin,
      ownedBrandIds,
      canManageBrands,
      filteredBrands: filteredBrands.length,
      loading: false,
      error: null,
    });

    console.log("\n🎯 CONCLUSION:");
    if (filteredBrands.length > 0) {
      console.log("✅ Frontend should show brands correctly");
    } else {
      console.log(
        "❌ Frontend will show 'No brands assigned' - this is the issue!"
      );
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

testFrontendData();
