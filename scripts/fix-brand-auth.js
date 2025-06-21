#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log("🔧 Brand Update Authentication Fix");
console.log("=".repeat(40));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBrandAuthIssues() {
  try {
    console.log("🔍 Diagnosing brand update authentication issues...");

    // 1. Check all admin users
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("❌ Error fetching users:", usersError.message);
      return;
    }

    console.log(`👥 Found ${users.users.length} users`);

    // 2. Check profiles and fix any missing admin profiles
    for (const user of users.users) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code === "PGRST116") {
        // Profile doesn't exist, create it
        console.log(`⚠️ Creating missing profile for ${user.email}`);

        const role = user.email.includes("admin") ? "admin" : "user";

        const { error: insertError } = await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          role: role,
          name: user.email.split("@")[0],
        });

        if (insertError) {
          console.error(
            `❌ Error creating profile for ${user.email}:`,
            insertError.message
          );
        } else {
          console.log(
            `✅ Created profile for ${user.email} with role: ${role}`
          );
        }
      } else if (profile) {
        console.log(`✅ ${user.email} - Role: ${profile.role}`);

        // Fix admin role if needed
        if (user.email === "admin@omahub.com" && profile.role !== "admin") {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ role: "admin" })
            .eq("id", user.id);

          if (updateError) {
            console.error("❌ Error updating admin role:", updateError.message);
          } else {
            console.log("✅ Fixed admin@omahub.com role to 'admin'");
          }
        }
      }
    }

    // 3. Test brand access
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name")
      .limit(3);

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError.message);
      return;
    }

    console.log(`🏢 Found ${brands.length} brands to test with`);

    // 4. Show login instructions
    console.log("\n🎯 TO FIX THE UNAUTHORIZED ERROR:");
    console.log("=".repeat(35));
    console.log("1. Open your browser to: http://localhost:3000/login");
    console.log("2. Login with one of these accounts:");
    console.log(
      "   • admin@omahub.com / admin123456 (Admin - can update any brand)"
    );
    console.log(
      "   • nnamdiohaka@gmail.com (Super Admin - can update any brand)"
    );
    console.log(
      "   • eloka@satellitelabs.xyz (Super Admin - can update any brand)"
    );
    console.log("\n3. After logging in, try updating the brand again");
    console.log("\n🔧 If you're still getting 401 errors after logging in:");
    console.log("   • Clear your browser cookies/localStorage");
    console.log("   • Try logging out and back in");
    console.log("   • Check the browser's Application tab for auth tokens");

    // 5. Create a test auth endpoint call
    console.log("\n🧪 Testing authentication endpoint...");

    try {
      const response = await fetch("http://localhost:3000/api/test-auth");
      const authData = await response.json();

      console.log("📊 Current auth status:", authData);

      if (!authData.authenticated) {
        console.log(
          "❌ You are NOT logged in - this is why you get 401 errors"
        );
        console.log("💡 Please log in first at http://localhost:3000/login");
      } else {
        console.log("✅ You are logged in as:", authData.user?.email);
      }
    } catch (fetchError) {
      console.log(
        "⚠️ Could not test auth endpoint - server might not be running"
      );
    }
  } catch (error) {
    console.error("❌ Fix failed:", error.message);
  }
}

fixBrandAuthIssues();
