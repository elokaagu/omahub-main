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

async function checkTailorsStructure() {
  try {
    console.log("🔍 Checking tailors table structure...");

    // Try to get just the ID first to see if table exists
    const { data: tailors, error: tailorsError } = await supabase
      .from("tailors")
      .select("id")
      .limit(1);

    if (tailorsError) {
      console.error("❌ Error accessing tailors table:", tailorsError);
      return;
    }

    console.log("✅ Tailors table exists");

    // Try to get all columns by selecting *
    const { data: allColumns, error: allColumnsError } = await supabase
      .from("tailors")
      .select("*")
      .limit(1);

    if (allColumnsError) {
      console.error("❌ Error getting all columns:", allColumnsError);
      return;
    }

    if (allColumns && allColumns.length > 0) {
      console.log("📋 Available columns:");
      Object.keys(allColumns[0]).forEach((column) => {
        console.log(`   - ${column}`);
      });

      // Now let's get some actual data with the correct column names
      const { data: sampleTailors, error: sampleError } = await supabase
        .from("tailors")
        .select("*")
        .limit(5);

      if (!sampleError && sampleTailors) {
        console.log(`\n📋 Sample tailors data (first 5):`);
        sampleTailors.forEach((tailor, index) => {
          console.log(`\n   Tailor ${index + 1}:`);
          Object.entries(tailor).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              console.log(`     ${key}: ${value}`);
            }
          });
        });
      }
    }

    console.log(`\n🎯 Tailors structure check completed!`);
  } catch (error) {
    console.error("❌ Error in checkTailorsStructure:", error);
  }
}

// Run the check
checkTailorsStructure()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
