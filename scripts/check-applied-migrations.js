const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAppliedMigrations() {
  console.log("🔍 Checking which migrations are actually applied...");

  try {
    // Check if the migrations table exists and what's in it
    const { data: migrations, error } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT version, name 
        FROM supabase_migrations.schema_migrations 
        ORDER BY version;
      `,
    });

    if (error) {
      console.log("⚠️  Could not access migrations table:", error.message);

      // Try alternative approach - check what tables exist
      console.log("\n📋 Checking what tables exist in your database...");

      const { data: tables, error: tablesError } = await supabase.rpc(
        "exec_sql",
        {
          sql: `
          SELECT table_name, table_schema
          FROM information_schema.tables 
          WHERE table_schema IN ('public', 'storage')
          AND table_type = 'BASE TABLE'
          ORDER BY table_schema, table_name;
        `,
        }
      );

      if (tablesError) {
        console.log("❌ Could not check tables:", tablesError.message);
        return;
      }

      console.log("\n📊 Existing tables:");
      tables.forEach((table) => {
        console.log(`  • ${table.table_schema}.${table.table_name}`);
      });

      // Check for specific key tables that would indicate migrations are applied
      const keyTables = [
        "profiles",
        "brands",
        "reviews",
        "catalogues",
        "collections",
        "hero_slides",
        "spotlight",
        "collection_images",
      ];

      console.log("\n🔍 Key tables status:");
      keyTables.forEach((tableName) => {
        const exists = tables.some(
          (t) => t.table_name === tableName && t.table_schema === "public"
        );
        console.log(`  ${exists ? "✅" : "❌"} ${tableName}`);
      });

      return;
    }

    if (migrations && migrations.length > 0) {
      console.log("\n✅ Applied migrations:");
      migrations.forEach((migration) => {
        console.log(
          `  • ${migration.version} - ${migration.name || "No name"}`
        );
      });
    } else {
      console.log("\n⚠️  No migrations found in schema_migrations table");
    }
  } catch (error) {
    console.error("❌ Error checking migrations:", error.message);
  }
}

checkAppliedMigrations();
