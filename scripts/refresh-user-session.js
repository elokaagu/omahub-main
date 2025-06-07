const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshUserSession() {
  try {
    console.log("🔄 Refreshing user session for eloka@culturin.com");

    // 1. Get the auth user
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return;
    }

    const elokaAuthUser = authUsers.users.find(
      (user) => user.email === "eloka@culturin.com"
    );

    if (!elokaAuthUser) {
      console.log("❌ User not found in auth.users");
      return;
    }

    console.log("✅ Found auth user:", elokaAuthUser.id);

    // 2. Update the profile to ensure it's current
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        email: "eloka@culturin.com",
        role: "brand_admin",
        owned_brands: ["ehbs-couture"],
        updated_at: new Date().toISOString(),
      })
      .eq("id", elokaAuthUser.id)
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

    // 3. Verify the update worked
    const { data: verifyProfile, error: verifyError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", elokaAuthUser.id)
      .single();

    if (verifyError) {
      console.error("❌ Error verifying profile:", verifyError);
      return;
    }

    console.log("✅ Verified profile:", {
      id: verifyProfile.id,
      email: verifyProfile.email,
      role: verifyProfile.role,
      owned_brands: verifyProfile.owned_brands,
    });

    console.log("\n🎉 User session refreshed successfully!");
    console.log(
      "💡 The user should now sign out and sign back in to see the changes."
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

refreshUserSession();
