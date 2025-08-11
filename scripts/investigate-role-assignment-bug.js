// Investigate Role Assignment Bug
// This script tests the role assignment logic to identify the bug

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

async function investigateRoleAssignmentBug() {
  console.log("🔍 Investigating Role Assignment Bug...\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Missing environment variables!");
    console.log("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔄 Step 1: Check current user profiles...");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, role, owned_brands, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.log("❌ Error fetching profiles:", profilesError.message);
      return;
    }

    console.log("📋 Current profiles:");
    profiles.forEach(profile => {
      const brandCount = profile.owned_brands ? profile.owned_brands.length : 0;
      console.log(`  ${profile.email}: ${profile.role} (${brandCount} brands)`);
    });

    console.log("\n🔄 Step 2: Check brands table...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name")
      .limit(5);

    if (brandsError) {
      console.log("❌ Error fetching brands:", brandsError.message);
      return;
    }

    console.log("📋 Sample brands:");
    brands.forEach(brand => {
      console.log(`  ${brand.id}: ${brand.name}`);
    });

    console.log("\n🔄 Step 3: Test role assignment logic...");
    
    // Simulate the role assignment logic from the API
    const testEmail = "carolineeyo5@gmail.com";
    const testRole = "super_admin";
    
    console.log(`Testing assignment of ${testRole} role to ${testEmail}...`);
    
    // Check if user exists
    const existingUser = profiles.find(p => p.email === testEmail);
    if (existingUser) {
      console.log(`✅ User found: ${existingUser.email} (current role: ${existingUser.role})`);
      
      if (testRole === "super_admin") {
        console.log("🔄 Auto-assigning all brands to super admin...");
        
        // Fetch all brand IDs (simulating the API logic)
        const { data: allBrands, error: brandsError } = await supabase
          .from("brands")
          .select("id");

        if (brandsError) {
          console.log("❌ Error fetching brands for auto-assignment:", brandsError.message);
        } else {
          const allBrandIds = allBrands.map(brand => brand.id);
          console.log(`✅ Would auto-assign ${allBrandIds.length} brands to super admin`);
          
          // Check if this matches what's currently assigned
          const currentBrandCount = existingUser.owned_brands ? existingUser.owned_brands.length : 0;
          console.log(`📊 Current brands: ${currentBrandCount}, Expected: ${allBrandIds.length}`);
          
          if (currentBrandCount !== allBrandIds.length) {
            console.log("🚨 MISMATCH DETECTED: Role assignment logic is not working correctly!");
            console.log("   This explains why Caroline has many brands instead of 'All brands' access");
          } else {
            console.log("✅ Brand count matches expected");
          }
        }
      }
    } else {
      console.log(`⚠️  User ${testEmail} not found in profiles`);
    }

    console.log("\n🔄 Step 4: Check for potential issues...");
    
    // Look for users with inconsistent role/brand assignments
    const inconsistentUsers = profiles.filter(profile => {
      if (profile.role === "super_admin") {
        // Super admins should have all brands or close to all
        const brandCount = profile.owned_brands ? profile.owned_brands.length : 0;
        return brandCount < 20; // Arbitrary threshold
      } else if (profile.role === "user") {
        // Regular users shouldn't have many brands
        const brandCount = profile.owned_brands ? profile.owned_brands.length : 0;
        return brandCount > 10; // Arbitrary threshold
      }
      return false;
    });

    if (inconsistentUsers.length > 0) {
      console.log("🚨 Found users with inconsistent role/brand assignments:");
      inconsistentUsers.forEach(user => {
        const brandCount = user.owned_brands ? user.owned_brands.length : 0;
        console.log(`  ${user.email}: ${user.role} with ${brandCount} brands`);
      });
    } else {
      console.log("✅ All users have consistent role/brand assignments");
    }

  } catch (error) {
    console.error("❌ Investigation failed:", error.message);
  }
}

investigateRoleAssignmentBug();
