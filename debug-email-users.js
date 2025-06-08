const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  console.log("Required:");
  console.log("- NEXT_PUBLIC_SUPABASE_URL");
  console.log("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function debugEmailUsers() {
  console.log("🔍 Debugging Email Users in Supabase...\n");

  try {
    // Get all users from auth.users
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("❌ Error fetching users:", error);
      return;
    }

    console.log(`📊 Total users found: ${users.users.length}\n`);

    // Filter email users and check their status
    const emailUsers = users.users.filter(
      (user) =>
        user.app_metadata.provider === "email" ||
        (user.email && !user.app_metadata.provider)
    );

    console.log(`📧 Email users: ${emailUsers.length}\n`);

    for (const user of emailUsers) {
      console.log(`👤 User: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Provider: ${user.app_metadata.provider || "email"}`);
      console.log(
        `   Email Confirmed: ${user.email_confirmed_at ? "✅ Yes" : "❌ No"}`
      );
      console.log(`   Created: ${new Date(user.created_at).toISOString()}`);
      console.log(
        `   Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toISOString() : "Never"}`
      );

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        console.log(`   Profile: ❌ Missing`);
      } else if (profileError) {
        console.log(`   Profile: ❌ Error - ${profileError.message}`);
      } else {
        console.log(`   Profile: ✅ Exists (${profile.role})`);
      }

      console.log("");
    }

    // Test login for specific user
    const testEmail = "eloka.agu@icloud.com";
    const testPassword = "newpassword123"; // From previous password reset

    console.log(`🧪 Testing login for ${testEmail}...\n`);

    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

    if (loginError) {
      console.log(`❌ Login test failed: ${loginError.message}`);

      if (loginError.message.includes("Invalid login credentials")) {
        console.log("💡 Possible causes:");
        console.log("   1. User does not exist");
        console.log("   2. Password is incorrect");
        console.log("   3. Email not confirmed");
      }
    } else {
      console.log(`✅ Login test successful!`);
      console.log(`   User: ${loginData.user.email}`);
      console.log(
        `   Session: ${loginData.session ? "Created" : "Not created"}`
      );
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

debugEmailUsers();
