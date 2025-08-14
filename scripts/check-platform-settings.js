const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkPlatformSettings() {
  try {
    console.log(
      "🔧 Checking platform settings for admin email configuration..."
    );

    // 1. Check if platform_settings table exists
    console.log("\n📋 Step 1: Checking if platform_settings table exists...");

    try {
      const { data: settings, error: settingsError } = await supabase
        .from("platform_settings")
        .select("key, value, created_at")
        .order("key");

      if (settingsError) {
        console.error(
          "❌ Error accessing platform_settings table:",
          settingsError
        );

        if (settingsError.code === "42P01") {
          console.log("   📝 Table doesn't exist - we need to create it");
          console.log("   🔧 This is likely why Studio access is failing");
        }
      } else {
        console.log(
          `✅ platform_settings table exists with ${settings.length} records`
        );

        if (settings.length > 0) {
          console.log("\n📊 Current platform settings:");
          settings.forEach((setting) => {
            console.log(`   - ${setting.key}: ${setting.value}`);
          });
        } else {
          console.log("   ⚠️ Table exists but has no records");
        }
      }
    } catch (e) {
      console.log("❌ Error checking platform_settings:", e.message);
    }

    // 2. Check if we can create the table and add admin emails
    console.log(
      "\n🔧 Step 2: Attempting to create platform_settings if needed..."
    );

    try {
      // Try to create the table
      const { error: createError } = await supabase.rpc(
        "create_platform_settings_table"
      );

      if (createError) {
        console.log(
          "   ⚠️ Could not create table via RPC:",
          createError.message
        );

        // Try direct SQL
        console.log("   🔧 Attempting direct SQL creation...");
        const { error: sqlError } = await supabase.rpc("exec_sql", {
          sql: `
            CREATE TABLE IF NOT EXISTS platform_settings (
              id SERIAL PRIMARY KEY,
              key TEXT UNIQUE NOT NULL,
              value TEXT NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `,
        });

        if (sqlError) {
          console.log("   ❌ Direct SQL creation failed:", sqlError.message);
        } else {
          console.log("   ✅ Table created successfully");
        }
      } else {
        console.log("   ✅ Table created via RPC");
      }
    } catch (e) {
      console.log("   ❌ Error in table creation:", e.message);
    }

    // 3. Check if we can insert admin email configuration
    console.log("\n📧 Step 3: Checking admin email configuration...");

    try {
      // Check if admin emails exist
      const { data: adminEmails, error: adminError } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["super_admin_emails", "brand_admin_emails"]);

      if (adminError) {
        console.log("   ❌ Error checking admin emails:", adminError.message);
      } else if (adminEmails.length === 0) {
        console.log("   ⚠️ No admin email configuration found");
        console.log("   🔧 This is why Studio access is failing!");

        // Try to insert the configuration
        console.log("   📝 Attempting to insert admin email configuration...");

        const adminConfig = [
          {
            key: "super_admin_emails",
            value: JSON.stringify([
              "eloka.agu@icloud.com",
              "shannonalisa@oma-hub.com",
              "eloka@satellitelabs.xyz",
              "nnamdiohaka@gmail.com",
              "carolineeyo5@gmail.com",
            ]),
          },
          {
            key: "brand_admin_emails",
            value: JSON.stringify([
              "eloka@culturin.com",
              "eloka.agu96@gmail.com",
            ]),
          },
        ];

        const { error: insertError } = await supabase
          .from("platform_settings")
          .insert(adminConfig);

        if (insertError) {
          console.log(
            "   ❌ Error inserting admin config:",
            insertError.message
          );
        } else {
          console.log("   ✅ Admin email configuration inserted successfully!");
        }
      } else {
        console.log("   ✅ Admin email configuration found:");
        adminEmails.forEach((email) => {
          console.log(`      - ${email.key}: ${email.value}`);
        });
      }
    } catch (e) {
      console.log("   ❌ Error in admin email check:", e.message);
    }

    // 4. Verify the current state
    console.log("\n🔍 Step 4: Final verification...");

    try {
      const { data: finalSettings, error: finalError } = await supabase
        .from("platform_settings")
        .select("key, value")
        .order("key");

      if (finalError) {
        console.log("   ❌ Final check failed:", finalError.message);
      } else {
        console.log(
          `   ✅ Final state: ${finalSettings.length} settings found`
        );
        finalSettings.forEach((setting) => {
          console.log(`      - ${setting.key}: ${setting.value}`);
        });
      }
    } catch (e) {
      console.log("   ❌ Final verification failed:", e.message);
    }

    console.log("\n🎯 Platform settings check completed!");
  } catch (error) {
    console.error("❌ Error in checkPlatformSettings:", error);
  }
}

// Run the check
checkPlatformSettings()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
