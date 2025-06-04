const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCollections() {
  try {
    console.log("🔍 Checking collections table...");

    // Check collections count
    const { data, error, count } = await supabase
      .from("collections")
      .select("*", { count: "exact" });

    if (error) {
      console.error("❌ Error fetching collections:", error);
      return;
    }

    console.log(`✅ Collections found: ${count}`);

    if (data && data.length > 0) {
      console.log("📋 Sample collection:", JSON.stringify(data[0], null, 2));

      // Check collections with brands
      console.log("\n🔍 Checking collections with brands...");
      const { data: collectionsWithBrands, error: brandsError } =
        await supabase.from("collections").select(`
          *,
          brand:brands(id, name, location, is_verified, category)
        `);

      if (brandsError) {
        console.error(
          "❌ Error fetching collections with brands:",
          brandsError
        );
      } else {
        console.log(
          "✅ Collections with brands:",
          collectionsWithBrands?.length || 0
        );
        if (collectionsWithBrands && collectionsWithBrands.length > 0) {
          console.log(
            "📋 Sample with brand:",
            JSON.stringify(collectionsWithBrands[0], null, 2)
          );
        }
      }
    } else {
      console.log("⚠️ No collections found in database");

      // Check if brands exist
      console.log("\n🔍 Checking brands table...");
      const {
        data: brands,
        error: brandError,
        count: brandCount,
      } = await supabase.from("brands").select("*", { count: "exact" });

      if (brandError) {
        console.error("❌ Error fetching brands:", brandError);
      } else {
        console.log(`✅ Brands found: ${brandCount}`);
        if (brands && brands.length > 0) {
          console.log("📋 Sample brand:", JSON.stringify(brands[0], null, 2));
        }
      }
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

checkCollections();
