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

async function checkActualTables() {
  try {
    console.log("🔍 Checking what tables actually exist in the database...");

    // Try to get table information using RPC
    try {
      const { data: tables, error: tablesError } =
        await supabase.rpc("get_all_tables");

      if (!tablesError && tables) {
        console.log(`📋 Found ${tables.length} tables:`);
        tables.forEach((table) => {
          console.log(`   - ${table.table_name}`);
        });
      } else {
        console.log("⚠️ Couldn't get tables via RPC, checking manually...");
      }
    } catch (e) {
      console.log("⚠️ RPC failed, checking manually...");
    }

    // Check common table names manually
    const commonTableNames = [
      "brands",
      "products",
      "collections",
      "catalogues",
      "services",
      "portfolio",
      "spotlight",
      "hero",
      "users",
      "reviews",
      "inbox",
    ];

    console.log("\n🔍 Checking common table names...");

    for (const tableName of commonTableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("id")
          .limit(1);

        if (!error) {
          console.log(`✅ Table "${tableName}" exists`);

          // Try to get column info
          try {
            const { data: sampleData, error: sampleError } = await supabase
              .from(tableName)
              .select("*")
              .limit(1);

            if (!sampleError && sampleData && sampleData[0]) {
              const columns = Object.keys(sampleData[0]);
              console.log(`   Columns: ${columns.join(", ")}`);
            }
          } catch (e) {
            console.log(`   Couldn't get column info for ${tableName}`);
          }
        } else {
          console.log(`❌ Table "${tableName}" doesn't exist`);
        }
      } catch (e) {
        console.log(`❌ Error checking table "${tableName}": ${e.message}`);
      }
    }

    // Check for any tables with 'image' or 'video' columns
    console.log("\n🔍 Looking for tables with media columns...");

    // Try to find tables by looking at the brands table structure first
    try {
      const { data: brandSample, error: brandError } = await supabase
        .from("brands")
        .select("*")
        .limit(1);

      if (!brandError && brandSample && brandSample[0]) {
        console.log("📋 Brands table structure:");
        const brandColumns = Object.keys(brandSample[0]);
        brandColumns.forEach((col) => {
          console.log(`   - ${col}`);
        });
      }
    } catch (e) {
      console.log("❌ Couldn't check brands table structure");
    }

    console.log("\n🎯 Table check completed!");
  } catch (error) {
    console.error("❌ Error in checkActualTables:", error);
  }
}

// Run the check
checkActualTables()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
