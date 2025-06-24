const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// List of email addresses to make super_admin
const adminEmails = ["eloka@satellitelabs.xyz", "eloka.agu@icloud.com"];

async function main() {
  try {
    console.log("Starting admin role update...");

    for (const email of adminEmails) {
      console.log(`Processing ${email}...`);

      // Get user by email
      const { data: user, error: userError } = await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("email", email)
        .single();

      if (userError) {
        console.error(`Error finding user ${email}:`, userError);
        continue;
      }

      if (!user) {
        console.log(`User not found for email: ${email}`);
        continue;
      }

      // Update to super_admin role
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          role: "super_admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error(`Error updating role for ${email}:`, updateError);
        continue;
      }

      console.log(`✅ Successfully updated ${email} to super_admin role`);
    }

    console.log("✅ Admin role update completed");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
