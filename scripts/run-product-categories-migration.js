const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error(
    "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runProductCategoriesMigration() {
  try {
    console.log("🚀 Starting Product Categories Migration...");
    console.log("📋 This migration adds product-level categories support");

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20250115000000_add_product_categories.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📖 Migration SQL loaded, executing...");

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", { sql: migrationSQL });

    if (error) {
      console.error("❌ Migration failed:", error);

      // If exec_sql doesn't exist, try direct SQL execution
      console.log("🔄 Trying direct SQL execution...");

      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        try {
          console.log(`🔧 Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc("exec_sql", {
            sql: statement + ";",
          });

          if (stmtError) {
            console.error(`❌ Statement failed: ${stmtError.message}`);
            // Continue with next statement
          }
        } catch (stmtError) {
          console.error(`❌ Statement execution error: ${stmtError.message}`);
        }
      }
    } else {
      console.log("✅ Migration completed successfully!");
    }

    // Verify the changes
    console.log("🔍 Verifying migration...");

    try {
      const { data: columns, error: columnError } = await supabase
        .from("products")
        .select("id, title, category, categories")
        .limit(5);

      if (columnError) {
        console.error("❌ Error verifying columns:", columnError);
      } else {
        console.log("✅ Products table structure verified");
        console.log("📊 Sample data:", columns);
      }
    } catch (verifyError) {
      console.error("❌ Verification failed:", verifyError);
    }

    // Test the search function
    console.log("🧪 Testing search function...");
    try {
      const { data: searchTest, error: searchError } = await supabase.rpc(
        "search_products_by_categories",
        { search_categories: ["Vacation", "Resort"] }
      );

      if (searchError) {
        console.log(
          "⚠️ Search function test failed (function may not exist yet):",
          searchError.message
        );
      } else {
        console.log(
          "✅ Search function working:",
          searchTest?.length || 0,
          "results"
        );
      }
    } catch (searchTestError) {
      console.log("⚠️ Search function test failed:", searchTestError.message);
    }

    console.log("🎉 Migration process completed!");
    console.log("\n📝 Next steps:");
    console.log(
      "1. Update your product creation forms to use the new categories field"
    );
    console.log("2. Test product filtering on the homepage");
    console.log(
      "3. Verify that products tagged with 'Vacation' now show up in vacation filters"
    );
  } catch (error) {
    console.error("❌ Migration failed with error:", error);
    process.exit(1);
  }
}

// Run the migration
runProductCategoriesMigration();
