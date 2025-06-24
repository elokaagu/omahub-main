const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables");
  console.error(
    "Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findOrphanedAuthUsers() {
  try {
    console.log("🔍 Finding orphaned auth users...");

    // Get all auth users
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return;
    }

    console.log(`📊 Found ${authUsers.users.length} auth users`);

    // Get all profile user IDs
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id");

    if (profileError) {
      console.error("❌ Error fetching profiles:", profileError);
      return;
    }

    console.log(`📊 Found ${profiles.length} profiles`);

    const profileIds = new Set(profiles.map((p) => p.id));
    const orphanedUsers = authUsers.users.filter(
      (user) => !profileIds.has(user.id)
    );

    console.log(`🔍 Found ${orphanedUsers.length} orphaned auth users:`);

    orphanedUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.email} (${user.id}) - Created: ${user.created_at}`
      );
    });

    return orphanedUsers;
  } catch (error) {
    console.error("❌ Error finding orphaned users:", error);
  }
}

async function cleanupOrphanedAuthUsers(dryRun = true) {
  try {
    const orphanedUsers = await findOrphanedAuthUsers();

    if (!orphanedUsers || orphanedUsers.length === 0) {
      console.log("✅ No orphaned auth users found");
      return;
    }

    if (dryRun) {
      console.log("\n🔍 DRY RUN MODE - No users will be deleted");
      console.log(
        "To actually delete these users, run: node scripts/cleanup-orphaned-auth-users.js --delete"
      );
      return;
    }

    console.log("\n🗑️ DELETING orphaned auth users...");

    let successCount = 0;
    let errorCount = 0;

    for (const user of orphanedUsers) {
      try {
        console.log(`🗑️ Deleting ${user.email} (${user.id})...`);

        const { error } = await supabase.auth.admin.deleteUser(user.id);

        if (error) {
          console.error(`❌ Failed to delete ${user.email}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Successfully deleted ${user.email}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error deleting ${user.email}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📊 Cleanup Summary:`);
    console.log(`✅ Successfully deleted: ${successCount} users`);
    console.log(`❌ Failed to delete: ${errorCount} users`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const shouldDelete = args.includes("--delete");

if (shouldDelete) {
  console.log("⚠️  WARNING: This will permanently delete orphaned auth users!");
  console.log("⚠️  Make sure you have a backup before proceeding.");

  // Add a 5-second delay to allow user to cancel
  setTimeout(() => {
    cleanupOrphanedAuthUsers(false);
  }, 5000);

  console.log("⏰ Starting deletion in 5 seconds... Press Ctrl+C to cancel");
} else {
  cleanupOrphanedAuthUsers(true);
}
