const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshElokaProfile() {
  try {
    console.log("🔄 Refreshing eloka@culturin.com profile...\n");

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

    console.log("✅ User found:", {
      id: elokaUser.id,
      email: elokaUser.email,
      last_sign_in_at: elokaUser.last_sign_in_at,
    });

    // Step 2: Update profile with correct data
    console.log("\n🔄 Updating profile with correct data...");

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        email: elokaUser.email,
        role: "brand_admin",
        owned_brands: ["ehbs-couture"],
        updated_at: new Date().toISOString(),
      })
      .eq("id", elokaUser.id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating profile:", updateError);
      return;
    }

    console.log("✅ Profile updated successfully:", {
      id: updatedProfile.id,
      email: updatedProfile.email,
      role: updatedProfile.role,
      owned_brands: updatedProfile.owned_brands,
    });

    // Step 3: Verify brand exists and is accessible
    console.log("\n📦 Verifying brand access...");

    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", "ehbs-couture")
      .single();

    if (brandError) {
      console.error("❌ Error fetching brand:", brandError);
      return;
    }

    console.log("✅ Brand verified:", {
      id: brand.id,
      name: brand.name,
      verified: brand.verified,
    });

    // Step 4: Test the complete flow
    console.log("\n🧪 Testing complete studio access flow...");

    // Simulate what the frontend would do
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", elokaUser.id)
      .single();

    if (profileError) {
      console.error("❌ Error in profile fetch test:", profileError);
      return;
    }

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("*")
      .in("id", profile.owned_brands || [])
      .order("name");

    if (brandsError) {
      console.error("❌ Error in brands fetch test:", brandsError);
      return;
    }

    console.log("✅ Complete flow test successful:");
    console.log(`   Profile Role: ${profile.role}`);
    console.log(`   Owned Brands: ${JSON.stringify(profile.owned_brands)}`);
    console.log(`   Brands Fetched: ${brands?.length || 0}`);
    brands?.forEach((b) => console.log(`     - ${b.name} (${b.id})`));

    // Step 5: Force auth refresh (simulate what would happen on next login)
    console.log("\n🔄 Simulating auth refresh...");

    // Update the user's last_sign_in_at to trigger a refresh
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      elokaUser.id,
      {
        user_metadata: {
          ...elokaUser.user_metadata,
          profile_refreshed_at: new Date().toISOString(),
        },
      }
    );

    if (authUpdateError) {
      console.error("❌ Error updating auth metadata:", authUpdateError);
    } else {
      console.log("✅ Auth metadata updated to trigger refresh");
    }

    console.log("\n🎯 PROFILE REFRESH COMPLETE");
    console.log("📋 Summary:");
    console.log(`   ✅ User: ${elokaUser.email}`);
    console.log(`   ✅ Role: ${profile.role}`);
    console.log(`   ✅ Owned Brands: ${profile.owned_brands?.length || 0}`);
    console.log(`   ✅ Accessible Brands: ${brands?.length || 0}`);
    console.log(
      "\n💡 User should now be able to access the studio with their brands!"
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the refresh
refreshElokaProfile();
