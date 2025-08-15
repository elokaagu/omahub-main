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

async function createBrandImageAssociationsTable() {
  try {
    console.log("🏗️ Creating brand image associations table...");
    console.log("=".repeat(70));
    console.log(
      "Note: This script will attempt to create the table structure."
    );
    console.log(
      "If it fails, you may need to create it manually in the Supabase dashboard."
    );
    console.log("");

    // 1. Try to create the table using a simple insert (will fail if table doesn't exist)
    console.log("\n📋 Step 1: Checking if table exists...");

    try {
      const { data: testQuery, error: testError } = await supabase
        .from("brand_image_assignments")
        .select("id")
        .limit(1);

      if (testError && testError.code === "42P01") {
        // Table doesn't exist
        console.log(
          "❌ Table doesn't exist. Please create it manually in Supabase dashboard:"
        );
        console.log("");
        console.log("SQL to run in Supabase SQL Editor:");
        console.log(`
CREATE TABLE brand_image_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  image_filename TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_description TEXT,
  assigned_by TEXT DEFAULT 'system',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_brand_image_assignments_brand_id ON brand_image_assignments(brand_id);
CREATE INDEX idx_brand_image_assignments_image_filename ON brand_image_assignments(image_filename);
CREATE INDEX idx_brand_image_assignments_verified ON brand_image_assignments(is_verified);

-- Add unique constraint to prevent duplicate assignments
ALTER TABLE brand_image_assignments ADD CONSTRAINT unique_brand_image UNIQUE (brand_id, image_filename);
        `);
        console.log("");
        console.log(
          "After creating the table, run this script again to populate it."
        );
        return;
      } else if (testError) {
        console.error("❌ Error checking table:", testError);
        return;
      }

      console.log("✅ Table already exists!");
    } catch (e) {
      console.error("❌ Exception checking table:", e.message);
      return;
    }

    // 2. Populate with current brand-image assignments
    console.log("\n📊 Step 2: Populating with current assignments...");

    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image, created_at")
      .order("name");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(`📦 Found ${brands.length} brands to process`);

    let successCount = 0;
    let errorCount = 0;

    for (const brand of brands) {
      if (brand.image) {
        const filename = brand.image.split("/").pop();

        try {
          const { error: insertError } = await supabase
            .from("brand_image_assignments")
            .insert({
              brand_id: brand.id,
              image_filename: filename,
              image_url: brand.image,
              image_description: `Auto-assigned from existing brand data`,
              assigned_by: "system_migration",
              is_verified: false,
              verification_notes: "Needs manual verification",
            });

          if (insertError) {
            if (insertError.code === "23505") {
              // Unique constraint violation
              console.log(`   ⚠️  ${brand.name}: Already exists in table`);
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
      } else {
        console.log(`   ⚠️  ${brand.name}: No image assigned`);
      }
    }

    // 3. Verification
    console.log("\n🔍 Step 3: Verifying table contents...");

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

    // 4. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎯 Brand image associations table populated!");

    console.log(`\n📊 Migration results:`);
    console.log(`   ✅ Successfully migrated: ${successCount} assignments`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📋 Total in table: ${assignments?.length || 0}`);

    console.log("\n🚀 Next steps:");
    console.log("   1. Run verification script to identify mismatches");
    console.log("   2. Manually verify and correct assignments");
    console.log("   3. Use this table for future image assignments");
  } catch (error) {
    console.error("❌ Error in createBrandImageAssociationsTable:", error);
  }
}

// Run the table creation
createBrandImageAssociationsTable()
  .then(() => {
    console.log("\n🏁 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
