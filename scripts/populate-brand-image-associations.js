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

async function populateBrandImageAssociations() {
  try {
    console.log("📊 Populating brand image associations table...");
    console.log("=".repeat(70));
    console.log("Make sure you've run the SQL migration first!");
    console.log("");

    // 1. Check if table exists
    console.log("📋 Step 1: Checking if table exists...");

    try {
      const { data: testQuery, error: testError } = await supabase
        .from("brand_image_assignments")
        .select("id")
        .limit(1);

      if (testError) {
        console.error("❌ Table doesn't exist or error accessing it:");
        console.error("   ", testError.message);
        console.log("");
        console.log("💡 Please run the SQL migration first:");
        console.log(
          "   File: supabase-migrations/create-brand-image-associations-table.sql"
        );
        console.log("   Run this in your Supabase SQL Editor");
        return;
      }

      console.log("✅ Table exists and is accessible!");
    } catch (e) {
      console.error("❌ Exception checking table:", e.message);
      return;
    }

    // 2. Get all brands with images
    console.log("\n📦 Step 2: Fetching brands with images...");

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .not("image", "is", null)
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`📦 Found ${brands.length} brands with images`);

    // 3. Populate associations table
    console.log("\n🔄 Step 3: Creating associations...");

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const brand of brands) {
      const filename = brand.image.split("/").pop();

      try {
        const { error: insertError } = await supabase
          .from("brand_image_assignments")
          .insert({
            brand_id: brand.id, // This is now TEXT, not UUID
            image_filename: filename,
            image_url: brand.image,
            image_description: `Auto-assigned from existing brand data`,
            assigned_by: "system_migration",
            is_verified: false,
            verification_notes:
              "Needs manual verification - migrated from existing data",
          });

        if (insertError) {
          if (insertError.code === "23505") {
            // Unique constraint violation
            console.log(`   ⚠️  ${brand.name}: Already exists in table`);
            skippedCount++;
          } else {
            console.error(`   ❌ ${brand.name}: ${insertError.message}`);
            errorCount++;
          }
        } else {
          console.log(`   ✅ ${brand.name}: ${filename}`);
          successCount++;
        }
      } catch (e) {
        console.error(`   ❌ ${brand.name}: Exception - ${e.message}`);
        errorCount++;
      }
    }

    // 4. Verification
    console.log("\n🔍 Step 4: Verifying table contents...");

    const { data: assignments, error: verifyError } = await supabase
      .from("brand_image_assignments")
      .select(
        `
        id,
        brand_id,
        image_filename,
        is_verified,
        assigned_at
      `
      )
      .order("assigned_at");

    if (verifyError) {
      console.error("❌ Error verifying table:", verifyError);
    } else {
      console.log(`📊 Table verification results:`);
      console.log(`   📋 Total assignments: ${assignments.length}`);
      console.log(
        `   ✅ Verified: ${assignments.filter((a) => a.is_verified).length}`
      );
      console.log(
        `   ⚠️  Unverified: ${assignments.filter((a) => !a.is_verified).length}`
      );

      if (assignments.length > 0) {
        console.log(`\n📋 Sample assignments:`);
        assignments.slice(0, 5).forEach((assignment) => {
          console.log(
            `   - ${assignment.image_filename} (Verified: ${assignment.is_verified})`
          );
        });
      }
    }

    // 5. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Brand image associations table populated!");

    console.log(`\n📊 Migration results:`);
    console.log(`   ✅ Successfully created: ${successCount} associations`);
    console.log(`   ⚠️  Already existed: ${skippedCount} associations`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total in table: ${assignments?.length || 0}`);

    console.log("\n🚀 Next steps:");
    console.log(
      "   1. Run verify-brand-image-associations.js to identify issues"
    );
    console.log("   2. Manually verify and correct assignments");
    console.log("   3. Use this table for future image management");
  } catch (error) {
    console.error("❌ Error in populateBrandImageAssociations:", error);
  }
}

// Run the population
populateBrandImageAssociations()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
