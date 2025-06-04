const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simulate the permissions service logic
const BRAND_ADMIN_EMAILS = ["eloka@culturin.com"];

function isBrandAdminEmail(email) {
  return BRAND_ADMIN_EMAILS.includes(email);
}

const rolePermissions = {
  user: [],
  brand_admin: ["studio.access", "studio.brands.manage"],
  admin: ["studio.access", "studio.brands.manage", "studio.collections.manage"],
  super_admin: [
    "studio.access",
    "studio.brands.manage",
    "studio.collections.manage",
    "studio.settings.manage",
  ],
};

async function simulateStudioAccess() {
  try {
    console.log("🧪 Testing Studio Access for eloka@culturin.com...\n");

    // Step 1: Get user from auth
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return;
    }

    const elokaUser = authUsers.users.find(
      (user) => user.email === "eloka@culturin.com"
    );

    if (!elokaUser) {
      console.error("❌ User eloka@culturin.com not found in auth.users");
      return;
    }

    console.log("✅ Step 1: User found in auth.users");

    // Step 2: Simulate permissions check
    console.log("\n🔍 Step 2: Simulating permissions check...");

    let permissions = [];
    if (isBrandAdminEmail(elokaUser.email)) {
      permissions = rolePermissions.brand_admin;
      console.log("✅ Brand admin email detected, permissions:", permissions);
    }

    // Step 3: Get profile
    console.log("\n👤 Step 3: Fetching user profile...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", elokaUser.id)
      .single();

    if (profileError) {
      console.error("❌ Error fetching profile:", profileError);
      return;
    }

    console.log("✅ Profile fetched:", {
      role: profile.role,
      owned_brands: profile.owned_brands,
    });

    // Step 4: Simulate studio access logic
    console.log("\n🏠 Step 4: Simulating studio access logic...");

    const hasStudioAccess = permissions.includes("studio.access");
    const canManageBrands = permissions.includes("studio.brands.manage");
    const isBrandOwner = profile.role === "brand_admin";
    const ownedBrandIds = profile.owned_brands || [];

    console.log("📊 Access Check Results:");
    console.log(`   Has Studio Access: ${hasStudioAccess}`);
    console.log(`   Can Manage Brands: ${canManageBrands}`);
    console.log(`   Is Brand Owner: ${isBrandOwner}`);
    console.log(`   Owned Brand IDs: ${JSON.stringify(ownedBrandIds)}`);

    // Step 5: Test brand fetching
    if (canManageBrands && isBrandOwner && ownedBrandIds.length > 0) {
      console.log("\n📦 Step 5: Testing brand fetching...");

      const { data: brands, error: brandsError } = await supabase
        .from("brands")
        .select("*")
        .in("id", ownedBrandIds)
        .order("name");

      if (brandsError) {
        console.error("❌ Error fetching brands:", brandsError);
      } else {
        console.log("✅ Brands fetched successfully:", brands?.length || 0);
        brands?.forEach((brand) => {
          console.log(`   - ${brand.name} (${brand.id})`);
        });
      }
    }

    // Step 6: Final assessment
    console.log("\n🎯 FINAL ASSESSMENT:");

    if (!hasStudioAccess) {
      console.log("❌ ISSUE: User does not have studio.access permission");
      console.log("   This would show 'Access Denied' page");
    } else if (!canManageBrands) {
      console.log(
        "❌ ISSUE: User does not have studio.brands.manage permission"
      );
      console.log("   This would show empty state");
    } else if (!isBrandOwner) {
      console.log("❌ ISSUE: User role is not brand_admin");
      console.log("   Current role:", profile.role);
    } else if (ownedBrandIds.length === 0) {
      console.log("❌ ISSUE: User has no owned brands");
      console.log("   This would show 'no brands assigned' message");
    } else {
      console.log("✅ SUCCESS: User should have full studio access");
      console.log("   - Can access studio dashboard");
      console.log("   - Can manage their brands");
      console.log("   - Can view analytics");
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the test
simulateStudioAccess();
