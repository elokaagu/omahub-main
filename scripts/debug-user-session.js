const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUserSession() {
  try {
    console.log("🔍 Debugging User Session for eloka@culturin.com");

    // 1. Check if user exists in auth.users
    console.log("\n1️⃣ Checking auth.users table...");
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return;
    }

    const elokaAuthUser = authUsers.users.find(
      (user) => user.email === "eloka@culturin.com"
    );

    if (elokaAuthUser) {
      console.log("✅ Found user in auth.users:", {
        id: elokaAuthUser.id,
        email: elokaAuthUser.email,
        email_confirmed_at: elokaAuthUser.email_confirmed_at,
        last_sign_in_at: elokaAuthUser.last_sign_in_at,
        created_at: elokaAuthUser.created_at,
      });
    } else {
      console.log("❌ User not found in auth.users");
      return;
    }

    // 2. Check profiles table
    console.log("\n2️⃣ Checking profiles table...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "eloka@culturin.com")
      .single();

    if (profileError) {
      console.error("❌ Error fetching profile:", profileError);

      // Check if profile exists with auth user ID
      console.log("🔍 Checking profile by auth user ID...");
      const { data: profileById, error: profileByIdError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", elokaAuthUser.id)
        .single();

      if (profileByIdError) {
        console.error("❌ Profile not found by ID either:", profileByIdError);

        // Create missing profile
        console.log("🔧 Creating missing profile...");
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: elokaAuthUser.id,
            email: "eloka@culturin.com",
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
          console.log("✅ Profile created successfully:", newProfile);
        }
      } else {
        console.log("✅ Found profile by ID:", profileById);
      }
    } else {
      console.log("✅ Found profile:", {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        owned_brands: profile.owned_brands,
      });

      // Check if profile ID matches auth user ID
      if (profile.id !== elokaAuthUser.id) {
        console.log("⚠️ Profile ID mismatch!");
        console.log("Auth user ID:", elokaAuthUser.id);
        console.log("Profile ID:", profile.id);

        // Update profile ID to match auth user
        console.log("🔧 Updating profile ID to match auth user...");
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ id: elokaAuthUser.id })
          .eq("email", "eloka@culturin.com");

        if (updateError) {
          console.error("❌ Error updating profile ID:", updateError);
        } else {
          console.log("✅ Profile ID updated successfully");
        }
      }
    }

    // 3. Test permissions service logic
    console.log("\n3️⃣ Testing permissions service logic...");

    // Simulate the permissions check
    const BRAND_ADMIN_EMAILS = ["eloka@culturin.com"];
    const isBrandAdminEmail = BRAND_ADMIN_EMAILS.includes("eloka@culturin.com");
    console.log("✅ Is brand admin email:", isBrandAdminEmail);

    const rolePermissions = {
      brand_admin: [
        "studio.access",
        "studio.brands.manage",
        "studio.catalogues.manage",
        "studio.catalogues.create",
        "studio.products.manage",
      ],
    };

    console.log("✅ Brand admin permissions:", rolePermissions.brand_admin);

    // 4. Check brand and catalogue data
    console.log("\n4️⃣ Verifying brand and catalogue data...");

    const { data: ehbsBrand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", "ehbs-couture")
      .single();

    if (brandError) {
      console.error("❌ Error fetching EHBS brand:", brandError);
    } else {
      console.log("✅ EHBS Couture brand:", ehbsBrand);
    }

    const { data: catalogues, error: catalogueError } = await supabase
      .from("catalogues")
      .select("*")
      .eq("brand_id", "ehbs-couture");

    if (catalogueError) {
      console.error("❌ Error fetching catalogues:", catalogueError);
    } else {
      console.log("✅ EHBS Couture catalogues:", catalogues);
    }

    console.log("\n🎉 Debug complete!");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

debugUserSession();
