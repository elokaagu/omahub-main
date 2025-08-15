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

async function checkBrandsTableStructure() {
  try {
    console.log("🔍 Checking brands table structure...");
    console.log("=".repeat(70));

    // 1. Get table information
    console.log("\n📋 Step 1: Getting table structure...");

    // Try to get a sample brand to see the structure
    const { data: sampleBrand, error: sampleError } = await supabase
      .from("brands")
      .select("*")
      .limit(1);

    if (sampleError) {
      console.error("❌ Error fetching sample brand:", sampleError);
      return;
    }

    if (sampleBrand && sampleBrand.length > 0) {
      const brand = sampleBrand[0];
      console.log("✅ Sample brand data:");
      console.log("   Brand object keys:", Object.keys(brand));

      // Check the id column type
      const idValue = brand.id;
      const idType = typeof idValue;
      console.log(`   ID column type: ${idType}`);
      console.log(`   ID value: ${idValue}`);
      console.log(`   ID length: ${idValue ? idValue.length : "N/A"}`);

      // Check if it looks like UUID
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isUUID = uuidPattern.test(idValue);
      console.log(`   Looks like UUID: ${isUUID}`);

      // Check other important columns
      if (brand.image) {
        console.log(`   Image URL: ${brand.image}`);
        console.log(`   Image type: ${typeof brand.image}`);
      }

      if (brand.created_at) {
        console.log(`   Created at: ${brand.created_at}`);
        console.log(`   Created at type: ${typeof brand.created_at}`);
      }
    }

    // 2. Get table schema information
    console.log("\n📊 Step 2: Getting table schema...");

    try {
      // Try to get column information
      const { data: columns, error: columnsError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable, column_default")
        .eq("table_name", "brands")
        .eq("table_schema", "public")
        .order("ordinal_position");

      if (columnsError) {
        console.log(
          "⚠️  Could not fetch column schema (this is normal in Supabase):"
        );
        console.log("   ", columnsError.message);
      } else if (columns && columns.length > 0) {
        console.log("📋 Table columns:");
        columns.forEach((col) => {
          console.log(
            `   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
          );
        });
      }
    } catch (e) {
      console.log("⚠️  Could not fetch column schema:", e.message);
    }

    // 3. Recommendations
    console.log("\n💡 Step 3: Recommendations...");

    if (sampleBrand && sampleBrand.length > 0) {
      const brand = sampleBrand[0];
      const idType = typeof brand.id;

      if (
        idType === "string" &&
        brand.id.length === 36 &&
        brand.id.includes("-")
      ) {
        console.log("✅ ID column appears to be UUID format (string)");
        console.log("   The migration should work with UUID type");
      } else if (idType === "string") {
        console.log("⚠️  ID column is string but not UUID format");
        console.log("   We may need to adjust the migration");
      } else {
        console.log(`❌ ID column is ${idType} type, not string`);
        console.log("   This will cause foreign key issues");
      }
    }

    console.log("\n🚀 Next steps:");
    console.log("   1. Review the table structure above");
    console.log("   2. Adjust the migration if needed");
    console.log("   3. Try creating the table again");
  } catch (error) {
    console.error("❌ Error in checkBrandsTableStructure:", error);
  }
}

// Run the check
checkBrandsTableStructure()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
