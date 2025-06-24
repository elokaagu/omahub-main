const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndUpdateUserRole() {
  try {
    // Get all users
    console.log("📋 Fetching all user profiles...");
    const { data: profiles, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("❌ Error fetching profiles:", fetchError);
      return;
    }

    console.log("\n👥 Current user profiles:");
    console.table(profiles);

    // Check for super admin emails
    const superAdminEmails = [
      "eloka.agu@icloud.com",
      "shannonalisa@oma-hub.com",
    ];

    for (const email of superAdminEmails) {
      const user = profiles.find((p) => p.email === email);
      if (user) {
        if (user.role !== "super_admin") {
          console.log(`\n🔧 Updating ${email} to super_admin...`);
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              role: "super_admin",
              updated_at: new Date().toISOString(),
            })
            .eq("email", email);

          if (updateError) {
            console.error(`❌ Error updating ${email}:`, updateError);
          } else {
            console.log(`✅ Successfully updated ${email} to super_admin`);
          }
        } else {
          console.log(`✅ ${email} already has super_admin role`);
        }
      } else {
        console.log(`⚠️  ${email} not found in profiles`);
      }
    }

    // Show updated profiles
    console.log("\n📋 Updated user profiles:");
    const { data: updatedProfiles } = await supabase
      .from("profiles")
      .select("id, email, role, updated_at")
      .order("created_at", { ascending: false });

    console.table(updatedProfiles);
  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

// Run the script
checkAndUpdateUserRole();
