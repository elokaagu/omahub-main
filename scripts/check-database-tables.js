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

async function checkDatabaseTables() {
  try {
    console.log("🔍 Checking database tables...");

    // Get all tables
    const { data: tables, error: tablesError } =
      await supabase.rpc("get_all_tables");

    if (tablesError) {
      console.error("❌ Error fetching tables:", tablesError);

      // Fallback: try to query information_schema
      console.log("🔄 Trying alternative method...");
      const { data: schemaTables, error: schemaError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public");

      if (schemaError) {
        console.error("❌ Error with information_schema:", schemaError);
        return;
      }

      console.log("📋 Tables found:");
      schemaTables.forEach((table) => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log("📋 Tables found:");
      tables.forEach((table) => {
        console.log(`   - ${table}`);
      });
    }

    // Look specifically for service-related tables
    console.log("\n🔍 Looking for service-related tables...");
    const serviceTables = [
      "services",
      "tailoring_services",
      "tailor_services",
      "brand_services",
    ];

    for (const tableName of serviceTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("id")
          .limit(1);

        if (!error && data) {
          console.log(
            `✅ Table '${tableName}' exists with ${data.length} records`
          );
        }
      } catch (e) {
        console.log(`❌ Table '${tableName}' does not exist`);
      }
    }

    console.log("\n🎯 Database table check completed!");
  } catch (error) {
    console.error("❌ Error in checkDatabaseTables:", error);
  }
}

// Run the check
checkDatabaseTables()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
