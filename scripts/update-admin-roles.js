const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    // Get all users from auth.users
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError) {
      throw usersError;
    }

    console.log(`Found ${users.users.length} users`);

    // Process each user
    for (const user of users.users) {
      console.log(`Processing user: ${user.email}`);

      // Update profile to super_admin
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
        console.error(`Error updating profile for ${user.email}:`, updateError);
        continue;
      }

      console.log(`✅ Updated ${user.email} to super_admin role`);
    }

    console.log("✅ Successfully updated all users to super_admin");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
