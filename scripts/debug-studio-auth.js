const { createClient } = require("@supabase/supabase-js");

// Supabase configuration
const supabaseUrl = "https://gswduyodzdgucjscjtvz.supabase.co";
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzd2R1eW9kemRndWNqc2NqdHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODAxNzQzOCwiZXhwIjoyMDYzNTkzNDM4fQ.4sqZxnRlSXQwRv7wB5JEWcpdTr5_Ucb97IF-32SRG7k";

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugStudioAuth() {
  try {
    console.log("🔍 Debugging Studio Authentication Issues...\n");

    // Step 1: Check user in auth.users
    console.log("1. Checking auth.users table...");
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

    console.log("✅ User found in auth.users:", {
      id: elokaUser.id,
      email: elokaUser.email,
      created_at: elokaUser.created_at,
      email_confirmed_at: elokaUser.email_confirmed_at,
      last_sign_in_at: elokaUser.last_sign_in_at,
    });

    // Step 2: Check profile in profiles table
    console.log("\n2. Checking profiles table...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "eloka@culturin.com")
      .single();

    if (profileError) {
      console.error("❌ Error fetching profile:", profileError);

      // Try by ID instead
      console.log("   Trying to fetch by user ID...");
      const { data: profileById, error: profileByIdError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", elokaUser.id)
        .single();

      if (profileByIdError) {
        console.error("❌ Error fetching profile by ID:", profileByIdError);

        // Check if profile exists at all
        console.log("   Checking all profiles for this user...");
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from("profiles")
          .select("*")
          .or(`email.eq.eloka@culturin.com,id.eq.${elokaUser.id}`);

        if (allProfilesError) {
          console.error("❌ Error fetching all profiles:", allProfilesError);
        } else {
          console.log("📋 All matching profiles:", allProfiles);
        }
      } else {
        console.log("✅ Profile found by ID:", profileById);
        profile = profileById;
      }
    } else {
      console.log("✅ Profile found by email:", profile);
    }

    if (!profile) {
      console.log("\n🔧 ISSUE IDENTIFIED: Profile not found!");
      console.log("   Creating profile for user...");

      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: elokaUser.id,
          email: elokaUser.email,
          role: "brand_admin",
          owned_brands: ["ehbs-couture"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Error creating profile:", createError);
      } else {
        console.log("✅ Profile created:", newProfile);
      }
      return;
    }

    // Step 3: Check owned brands
    console.log("\n3. Checking owned brands...");
    console.log("   Profile owned_brands:", profile.owned_brands);

    if (!profile.owned_brands || profile.owned_brands.length === 0) {
      console.log("🔧 ISSUE IDENTIFIED: No owned_brands in profile!");
      console.log("   Updating profile with owned brands...");

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          owned_brands: ["ehbs-couture"],
          role: "brand_admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", elokaUser.id)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Error updating profile:", updateError);
      } else {
        console.log("✅ Profile updated:", updatedProfile);
      }
    }

    // Step 4: Test brand fetch with owned_brands
    console.log("\n4. Testing brand fetch with owned_brands...");
    const ownedBrandIds = profile.owned_brands || ["ehbs-couture"];

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("*")
      .in("id", ownedBrandIds);

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
    } else {
      console.log("✅ Brands fetched:", brands?.length || 0);
      brands?.forEach((brand) => {
        console.log(`   - ${brand.name} (${brand.id})`);
      });
    }

    // Step 5: Check permissions
    console.log("\n5. Checking permissions...");
    const { data: permissions, error: permissionsError } = await supabase
      .from("user_permissions")
      .select("permission")
      .eq("user_id", elokaUser.id);

    if (permissionsError) {
      console.error("❌ Error fetching permissions:", permissionsError);
    } else {
      console.log(
        "✅ User permissions:",
        permissions?.map((p) => p.permission) || []
      );
    }

    console.log("\n🎯 DIAGNOSIS COMPLETE");
    console.log("📋 Summary:");
    console.log(`   Auth User ID: ${elokaUser.id}`);
    console.log(`   Profile Role: ${profile?.role}`);
    console.log(`   Owned Brands: ${JSON.stringify(profile?.owned_brands)}`);
    console.log(`   Permissions: ${permissions?.length || 0} found`);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the debug
debugStudioAuth();
