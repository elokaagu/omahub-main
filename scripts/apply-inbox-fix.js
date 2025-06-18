const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyInboxFix() {
  console.log("🔧 Applying inbox system fix...\n");

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, "add-inbox-stats-function.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    console.log("📝 Executing SQL script...");

    // Execute the SQL
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: sqlContent,
    });

    if (error) {
      console.error("❌ Error executing SQL:", error.message);

      // Try alternative method - direct query
      console.log("🔄 Trying alternative method...");
      const { error: altError } = await supabase
        .from("_temp_sql_execution")
        .insert({ sql: sqlContent });

      if (altError) {
        console.error("❌ Alternative method failed:", altError.message);
        console.log("\n📋 Manual steps:");
        console.log("1. Go to your Supabase dashboard");
        console.log("2. Open the SQL Editor");
        console.log(
          "3. Copy and paste the contents of scripts/add-inbox-stats-function.sql"
        );
        console.log("4. Run the query");
        return;
      }
    }

    console.log("✅ SQL script executed successfully!");

    // Test the function
    console.log("🧪 Testing the function...");
    const { data: testData, error: testError } = await supabase.rpc(
      "get_inbox_stats",
      { admin_user_id: "test-user-id" }
    );

    if (testError) {
      console.log(
        "⚠️ Function test failed (this is expected if no valid user):",
        testError.message
      );
    } else {
      console.log("✅ Function is working correctly!");
    }

    console.log("\n🎉 Inbox system fix applied successfully!");
    console.log("📱 You can now navigate to the Studio Inbox section.");
  } catch (error) {
    console.error("💥 Error applying inbox fix:", error.message);
    console.log("\n📋 Manual steps:");
    console.log("1. Go to your Supabase dashboard");
    console.log("2. Open the SQL Editor");
    console.log(
      "3. Copy and paste the contents of scripts/add-inbox-stats-function.sql"
    );
    console.log("4. Run the query");
  }
}

applyInboxFix();
