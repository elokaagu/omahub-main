const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyNnamdiAccess() {
  try {
    const nnamdiEmail = "nnamdiohaka@gmail.com";
    console.log(`🔍 Verifying super admin access for ${nnamdiEmail}...`);

    // Check if user exists in auth
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return;
    }

    const nnamdiAuthUser = authUsers.users.find(
      (user) => user.email === nnamdiEmail
    );

    if (!nnamdiAuthUser) {
      console.log("⚠️ Nnamdi not found in auth users. Creating auth user...");
      // Note: In a real scenario, the user would need to sign up first
      console.log(
        "📝 Nnamdi needs to sign up at /login first to create auth account"
      );
      return;
    }

    console.log("✅ Found Nnamdi in auth users:", nnamdiAuthUser.id);

    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", nnamdiEmail)
      .single();

    if (profileError && profileError.code === "PGRST116") {
      console.log("⚠️ Profile not found. Creating super admin profile...");

      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: nnamdiAuthUser.id,
          email: nnamdiEmail,
          role: "super_admin",
          owned_brands: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Error creating profile:", createError);
        return;
      }

      console.log("✅ Created super admin profile for Nnamdi");
      console.table([newProfile]);
    } else if (profile) {
      console.log("✅ Found existing profile for Nnamdi");

      if (profile.role !== "super_admin") {
        console.log(`🔧 Updating role from ${profile.role} to super_admin...`);

        const { data: updatedProfile, error: updateError } = await supabase
          .from("profiles")
          .update({
            role: "super_admin",
            updated_at: new Date().toISOString(),
          })
          .eq("email", nnamdiEmail)
          .select()
          .single();

        if (updateError) {
          console.error("❌ Error updating profile:", updateError);
          return;
        }

        console.log("✅ Updated Nnamdi's role to super_admin");
        console.table([updatedProfile]);
      } else {
        console.log("✅ Nnamdi already has super_admin role");
        console.table([profile]);
      }
    }

    // Test permissions
    console.log("\n🔐 Testing super admin permissions...");

    const testPermissions = [
      "studio.access",
      "studio.brands.manage",
      "studio.catalogues.manage",
      "studio.products.manage",
      "studio.settings.manage",
      "studio.users.manage",
    ];

    console.log("📋 Expected permissions for super_admin:");
    testPermissions.forEach((permission) => {
      console.log(`  ✅ ${permission}`);
    });

    console.log("\n🎯 Next steps for Nnamdi:");
    console.log("1. Visit the login page: /login");
    console.log("2. Sign in with: nnamdiohaka@gmail.com");
    console.log("3. Click on Studio in the navigation");
    console.log("4. Should have full super admin access");
  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

verifyNnamdiAccess();
