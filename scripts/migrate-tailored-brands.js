#!/usr/bin/env node

/**
 * Migration script to add existing Tailored brands to the Tailors Directory
 * This script will migrate brands with category "Tailored" to the tailors table
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

// Tailored brands data to migrate
const tailoredBrandsData = [
  {
    brand_id: "tunis-tailors",
    title: "Bespoke Mediterranean Tailored",
    image: "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
    description:
      "Master tailors specializing in Mediterranean-inspired bespoke garments with traditional Tunisian craftsmanship and contemporary styling.",
    specialties: [
      "Bespoke Suits",
      "Formal Wear",
      "Shirts",
      "Mediterranean Style",
      "Traditional Tailored",
    ],
    price_range: "$$$$",
    lead_time: "3-4 weeks",
    consultation_fee: 100.0,
  },
  {
    brand_id: "casablanca-cuts",
    title: "Moroccan Bespoke Tailored",
    image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
    description:
      "Contemporary bespoke tailored house combining traditional Moroccan craftsmanship with modern techniques. Specializing in both traditional Moroccan garments and contemporary suits with distinctive North African flair.",
    specialties: [
      "Bespoke Suits",
      "Moroccan Traditional",
      "Contemporary Design",
      "Custom Fit",
      "North African Style",
    ],
    price_range: "$$$$",
    lead_time: "2-3 weeks",
    consultation_fee: 150.0,
  },
];

async function migrateTailoredBrands() {
  console.log(
    "🚀 Starting migration of Tailored brands to Tailors Directory...\n"
  );

  try {
    // Check existing brands with Tailored category
    console.log("📋 Checking existing brands with Tailored category...");
    const { data: existingBrands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, category, location")
      .eq("category", "Tailored");

    if (brandsError) {
      console.error("❌ Error fetching brands:", brandsError);
      return;
    }

    console.log(
      `✅ Found ${existingBrands?.length || 0} brands with Tailored category:`
    );
    existingBrands?.forEach((brand) => {
      console.log(`   - ${brand.name} (${brand.location})`);
    });

    // Check existing tailors
    console.log("\n🔍 Checking existing tailors...");
    const { data: existingTailors, error: tailorsError } = await supabase
      .from("tailors")
      .select("id, title, brand_id");

    if (tailorsError) {
      console.error("❌ Error fetching tailors:", tailorsError);
      return;
    }

    const existingTailorBrandIds =
      existingTailors?.map((t) => t.brand_id) || [];
    console.log(
      `✅ Found ${existingTailors?.length || 0} existing tailors for brand IDs:`,
      existingTailorBrandIds
    );

    // Migrate each tailored brand
    let migratedCount = 0;
    let skippedCount = 0;

    for (const tailorData of tailoredBrandsData) {
      console.log(`\n🔄 Processing ${tailorData.title}...`);

      // Check if brand exists
      const brandExists = existingBrands?.some(
        (b) => b.id === tailorData.brand_id
      );
      if (!brandExists) {
        console.log(
          `   ⚠️  Brand ${tailorData.brand_id} not found, skipping...`
        );
        skippedCount++;
        continue;
      }

      // Check if tailor already exists for this brand
      if (existingTailorBrandIds.includes(tailorData.brand_id)) {
        console.log(
          `   ⚠️  Tailor already exists for brand ${tailorData.brand_id}, skipping...`
        );
        skippedCount++;
        continue;
      }

      // Insert tailor
      const { data: newTailor, error: insertError } = await supabase
        .from("tailors")
        .insert({
          brand_id: tailorData.brand_id,
          title: tailorData.title,
          image: tailorData.image,
          description: tailorData.description,
          specialties: tailorData.specialties,
          price_range: tailorData.price_range,
          lead_time: tailorData.lead_time,
          consultation_fee: tailorData.consultation_fee,
        })
        .select()
        .single();

      if (insertError) {
        console.log(`   ❌ Error inserting tailor: ${insertError.message}`);
        continue;
      }

      console.log(`   ✅ Successfully migrated: ${tailorData.title}`);
      migratedCount++;
    }

    console.log("\n📊 Migration Summary:");
    console.log(`   ✅ Successfully migrated: ${migratedCount} tailors`);
    console.log(`   ⚠️  Skipped: ${skippedCount} tailors`);

    // Verify migration
    console.log("\n🔍 Verifying migration...");
    const { data: allTailors, error: verifyError } = await supabase
      .from("tailors")
      .select(
        `
        id,
        title,
        brand_id,
        brand:brands(name, category, location)
      `
      );

    if (verifyError) {
      console.error("❌ Error verifying migration:", verifyError);
      return;
    }

    console.log(`✅ Total tailors in database: ${allTailors?.length || 0}`);
    console.log("\nTailors with Tailored brands:");
    allTailors
      ?.filter((t) => t.brand?.category === "Tailored")
      .forEach((tailor) => {
        console.log(
          `   - ${tailor.title} (${tailor.brand?.name} - ${tailor.brand?.location})`
        );
      });

    console.log("\n🎉 Migration completed successfully!");
    console.log(
      "\n💡 You can now view the tailors at: http://localhost:3000/tailors"
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrateTailoredBrands()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateTailoredBrands };
