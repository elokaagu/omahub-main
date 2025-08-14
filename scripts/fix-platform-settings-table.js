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

async function fixPlatformSettingsTable() {
  try {
    console.log("🔧 Fixing platform_settings table structure...");

    // 1. Check current table structure
    console.log("\n📋 Step 1: Checking current table structure...");

    try {
      const { data: sampleData, error: sampleError } = await supabase
        .from("platform_settings")
        .select("*")
        .limit(1);

      if (sampleError) {
        console.error("❌ Error accessing table:", sampleError);
      } else if (sampleData && sampleData.length > 0) {
        console.log("✅ Table is accessible");
        console.log("📊 Current columns:", Object.keys(sampleData[0]));
      }
    } catch (e) {
      console.log("❌ Error checking table structure:", e.message);
    }

    // 2. Try to add missing columns if they don't exist
    console.log("\n🔧 Step 2: Attempting to add missing columns...");

    const columnsToAdd = [
      "created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
      "updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
    ];

    for (const columnDef of columnsToAdd) {
      try {
        const columnName = columnDef.split(" ")[0];
        console.log(`   🔧 Adding column: ${columnName}`);

        // Try to add the column
        const { error: addError } = await supabase.rpc(
          "add_column_if_not_exists",
          {
            table_name: "platform_settings",
            column_name: columnName,
            column_definition: columnDef,
          }
        );

        if (addError) {
          console.log(
            `   ⚠️ Could not add ${columnName} via RPC:`,
            addError.message
          );

          // Try direct SQL
          console.log(`   🔧 Attempting direct SQL for ${columnName}...`);
          const { error: sqlError } = await supabase.rpc("exec_sql", {
            sql: `ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS ${columnDef};`,
          });

          if (sqlError) {
            console.log(
              `   ❌ Direct SQL failed for ${columnName}:`,
              sqlError.message
            );
          } else {
            console.log(`   ✅ Column ${columnName} added successfully`);
          }
        } else {
          console.log(`   ✅ Column ${columnName} added via RPC`);
        }
      } catch (e) {
        console.log(`   ❌ Error adding column: ${e.message}`);
      }
    }

    // 3. Verify the admin email configuration is working
    console.log("\n📧 Step 3: Testing admin email configuration...");

    try {
      const { data: adminEmails, error: adminError } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["super_admin_emails", "brand_admin_emails"]);

      if (adminError) {
        console.log("   ❌ Error checking admin emails:", adminError.message);
      } else {
        console.log("   ✅ Admin email configuration found:");
        adminEmails.forEach((email) => {
          console.log(`      - ${email.key}: ${email.value}`);
        });

        // Test if the emails are properly parsed
        const superAdminEmails = JSON.parse(
          adminEmails.find((e) => e.key === "super_admin_emails")?.value || "[]"
        );
        const brandAdminEmails = JSON.parse(
          adminEmails.find((e) => e.key === "brand_admin_emails")?.value || "[]"
        );

        console.log(`   📊 Super admin emails: ${superAdminEmails.length}`);
        console.log(`   📊 Brand admin emails: ${brandAdminEmails.length}`);
      }
    } catch (e) {
      console.log("   ❌ Error in admin email test:", e.message);
    }

    // 4. Test a specific email to see if it's recognized
    console.log("\n🧪 Step 4: Testing specific email recognition...");

    try {
      // Test with a known super admin email
      const testEmail = "eloka.agu@icloud.com";
      console.log(`   🧪 Testing email: ${testEmail}`);

      const { data: adminEmails, error: adminError } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "super_admin_emails")
        .single();

      if (!adminError && adminEmails?.value) {
        const superAdminEmails = JSON.parse(adminEmails.value);
        const isSuperAdmin = superAdminEmails.includes(testEmail);
        console.log(
          `   ✅ ${testEmail} is ${isSuperAdmin ? "a super admin" : "NOT a super admin"}`
        );

        if (isSuperAdmin) {
          console.log("   🎯 This should grant Studio access!");
        }
      } else {
        console.log("   ❌ Could not verify email status");
      }
    } catch (e) {
      console.log("   ❌ Error in email test:", e.message);
    }

    // 5. Final verification
    console.log("\n🔍 Step 5: Final table verification...");

    try {
      const { data: finalData, error: finalError } = await supabase
        .from("platform_settings")
        .select("*")
        .order("key");

      if (finalError) {
        console.log("   ❌ Final check failed:", finalError.message);
      } else {
        console.log(`   ✅ Final state: ${finalData.length} settings found`);
        console.log("   📊 Table structure:");
        if (finalData.length > 0) {
          console.log("      Columns:", Object.keys(finalData[0]));
        }
      }
    } catch (e) {
      console.log("   ❌ Final verification failed:", e.message);
    }

    console.log("\n🎯 Platform settings table fix completed!");
    console.log("\n💡 Next steps:");
    console.log("   1. Try logging into the Studio again");
    console.log("   2. The admin email configuration should now work");
    console.log(
      "   3. Users with super_admin or brand_admin emails should have access"
    );
  } catch (error) {
    console.error("❌ Error in fixPlatformSettingsTable:", error);
  }
}

// Run the fix
fixPlatformSettingsTable()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
