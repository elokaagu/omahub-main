// Check Products Table Structure in Supabase
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

async function checkProductsTableStructure() {
  console.log("🔍 Checking Products Table Structure in Supabase...\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Missing environment variables!");
    console.log(
      "Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    );
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if products table exists and get its structure
    console.log("🔄 Checking products table structure...");

    // Try to get a sample row to see what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .from("products")
      .select("*")
      .limit(1);

    if (sampleError) {
      console.log("❌ Error accessing products table:", sampleError.message);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log("✅ Products table exists and is accessible");
      console.log("📋 Sample row columns:", Object.keys(sampleData[0]));

      // Check specific columns we need
      const sampleRow = sampleData[0];
      const requiredColumns = [
        "service_type",
        "materials",
        "techniques",
        "inspiration",
      ];

      console.log("\n🔍 Checking required columns:");
      requiredColumns.forEach((col) => {
        const exists = col in sampleRow;
        const value = sampleRow[col];
        console.log(
          `${exists ? "✅" : "❌"} ${col}: ${exists ? value || "null" : "MISSING"}`
        );
      });

      // Check if service_type exists and what values it has
      if ("service_type" in sampleRow) {
        console.log("\n🔄 Checking existing service_type values...");
        const { data: serviceTypes, error: serviceError } = await supabase
          .from("products")
          .select("service_type")
          .not("service_type", "is", null);

        if (!serviceError && serviceTypes) {
          const uniqueTypes = [
            ...new Set(serviceTypes.map((item) => item.service_type)),
          ];
          console.log("📊 Current service_type values:", uniqueTypes);
        }
      }
    } else {
      console.log("⚠️  Products table exists but has no data");
    }

    // Try to get table schema info
    console.log("\n🔄 Attempting to get table schema...");
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_name", "products")
        .order("ordinal_position");

      if (schemaError) {
        console.log("⚠️  Could not get schema info:", schemaError.message);
      } else if (schemaData) {
        console.log("📋 Table schema:");
        schemaData.forEach((col) => {
          console.log(
            `  ${col.column_name}: ${col.data_type} (${col.is_nullable === "YES" ? "nullable" : "not null"})`
          );
        });
      }
    } catch (schemaErr) {
      console.log("⚠️  Schema query failed:", schemaErr.message);
    }
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

checkProductsTableStructure();
