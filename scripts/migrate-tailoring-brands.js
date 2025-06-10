#!/usr/bin/env node

/**
 * Migration script to add existing Tailoring brands to the Tailors Directory
 * This script will migrate brands with category "Tailoring" to the tailors table
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Missing Supabase configuration. Please check your .env.local file."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tailoring brands data to migrate
const tailoringBrandsData = [
  {
    brandId: "tunis-tailors",
    brandName: "Tunis Master Tailors",
    title: "Bespoke Mediterranean Tailoring",
    description:
      "Master tailor specializing in bespoke menswear that blends Mediterranean elegance with North African craftsmanship. Over three decades of excellence in creating impeccably fitted suits, shirts, and formal wear.",
    specialties: [
      "Bespoke Suits",
      "Formal Wear",
      "Shirts",
      "Mediterranean Style",
      "Traditional Tailoring",
    ],
    priceRange: "TND 800 - TND 5,000",
    leadTime: "3-4 weeks",
    consultationFee: 75.0,
  },
  {
    brandId: "casablanca-cuts",
    brandName: "Casablanca Cuts",
    title: "Moroccan Bespoke Tailoring",
    description:
      "Contemporary bespoke tailoring house combining traditional Moroccan craftsmanship with modern techniques. Specializing in both traditional Moroccan garments and contemporary suits with distinctive North African flair.",
    specialties: [
      "Bespoke Suits",
      "Traditional Moroccan Wear",
      "Contemporary Menswear",
      "Custom Design",
      "Alterations",
    ],
    priceRange: "MAD 5,000 - MAD 30,000",
    leadTime: "2-3 weeks",
    consultationFee: 100.0,
  },
];

async function migrateTailoringBrands() {
  console.log(
    "🚀 Starting migration of tailoring brands to tailors table...\n"
  );

  try {
    // First, check if the tailors table exists and get existing tailoring brands
    console.log("📋 Checking existing brands with Tailoring category...");

    const { data: existingBrands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, category, image, location")
      .eq("category", "Tailoring");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(
      `✅ Found ${existingBrands.length} tailoring brands in database:`
    );
    existingBrands.forEach((brand) => {
      console.log(`   - ${brand.name} (${brand.id})`);
    });
    console.log("");

    // Check existing tailors to avoid duplicates
    console.log("🔍 Checking existing tailors...");
    const { data: existingTailors, error: tailorsError } = await supabase
      .from("tailors")
      .select("brand_id, title");

    if (tailorsError && tailorsError.code !== "PGRST116") {
      // PGRST116 = table doesn't exist
      console.error("❌ Error checking existing tailors:", tailorsError);
      return;
    }

    const existingTailorBrandIds = existingTailors
      ? existingTailors.map((t) => t.brand_id)
      : [];
    console.log(`✅ Found ${existingTailorBrandIds.length} existing tailors\n`);

    // Migrate each tailoring brand
    let migratedCount = 0;
    let skippedCount = 0;

    for (const tailorData of tailoringBrandsData) {
      console.log(`🔄 Processing ${tailorData.brandName}...`);

      // Check if brand exists in database
      const brand = existingBrands.find(
        (b) => b.id === tailorData.brandId || b.name === tailorData.brandName
      );

      if (!brand) {
        console.log(`   ⚠️  Brand not found in database, skipping...`);
        skippedCount++;
        continue;
      }

      // Check if tailor already exists
      if (existingTailorBrandIds.includes(brand.id)) {
        console.log(`   ⚠️  Tailor already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Insert tailor
      const { data: newTailor, error: insertError } = await supabase
        .from("tailors")
        .insert({
          brand_id: brand.id,
          title: tailorData.title,
          image: brand.image,
          description: tailorData.description,
          specialties: tailorData.specialties,
          price_range: tailorData.priceRange,
          lead_time: tailorData.leadTime,
          consultation_fee: tailorData.consultationFee,
        })
        .select()
        .single();

      if (insertError) {
        console.log(`   ❌ Error inserting tailor: ${insertError.message}`);
        continue;
      }

      console.log(`   ✅ Successfully added tailor: ${tailorData.title}`);
      migratedCount++;
    }

    console.log("\n📊 Migration Summary:");
    console.log(`   ✅ Successfully migrated: ${migratedCount} tailors`);
    console.log(`   ⚠️  Skipped: ${skippedCount} tailors`);

    // Verify the migration
    console.log("\n🔍 Verifying migration...");
    const { data: allTailors, error: verifyError } = await supabase.from(
      "tailors"
    ).select(`
        id,
        title,
        specialties,
        price_range,
        lead_time,
        brand:brands(name, location, category)
      `);

    if (verifyError) {
      console.error("❌ Error verifying migration:", verifyError);
      return;
    }

    console.log(`✅ Total tailors in database: ${allTailors.length}`);
    console.log("\nTailors with Tailoring brands:");
    allTailors
      .filter((t) => t.brand?.category === "Tailoring")
      .forEach((tailor) => {
        console.log(`   - ${tailor.title} (${tailor.brand.name})`);
        console.log(
          `     Specialties: ${tailor.specialties?.join(", ") || "None"}`
        );
        console.log(
          `     Price Range: ${tailor.price_range || "Not specified"}`
        );
        console.log(`     Lead Time: ${tailor.lead_time || "Not specified"}`);
        console.log("");
      });

    console.log("🎉 Migration completed successfully!");
    console.log("\n💡 Next steps:");
    console.log("   1. Visit /tailors to see the migrated tailors");
    console.log("   2. You can add more tailors through the admin interface");
    console.log(
      "   3. Consider adding tailors for other categories like Bridal"
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrateTailoringBrands()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateTailoringBrands };
