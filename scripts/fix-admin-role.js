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

    if (!users || users.users.length === 0) {
      console.error("No users found in the system.");
      process.exit(1);
    }

    console.log(`Found ${users.users.length} users`);

    // Process each user
    for (const user of users.users) {
      console.log(`Processing user: ${user.email}`);

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error(
          `Error checking profile for ${user.email}:`,
          profileError
        );
        continue;
      }

      if (!profile) {
        console.log(
          `Creating new profile with admin role for ${user.email}...`
        );
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            role: "admin",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error(
            `Error creating profile for ${user.email}:`,
            createError
          );
          continue;
        }

        console.log(
          `Created new profile with admin role for ${user.email}:`,
          newProfile
        );
      } else {
        console.log(
          `Updating existing profile with admin role for ${user.email}...`
        );
        const { data: updatedProfile, error: updateError } = await supabase
          .from("profiles")
          .update({
            role: "admin",
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .select()
          .single();

        if (updateError) {
          console.error(
            `Error updating profile for ${user.email}:`,
            updateError
          );
          continue;
        }

        console.log(
          `Updated profile with admin role for ${user.email}:`,
          updatedProfile
        );
      }
    }

    console.log("✅ Successfully processed all users");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
