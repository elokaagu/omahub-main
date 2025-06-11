#!/usr/bin/env node

/**
 * Script to migrate real "Tailored" category brands to the Tailors Directory
 * This will migrate brands from Bridal, Wedding Guest, Event Wear, Birthday, and Custom Design categories
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

// Categories that belong to "Tailored" main category
const tailoredCategories = [
  "Bridal",
  "Wedding Guest",
  "Event Wear",
  "Birthday",
  "Custom Design",
];

// Mapping of brand categories to tailor specializations
const categoryToSpecialties = {
  Bridal: {
    specialties: [
      "Wedding Dresses",
      "Bridal Wear",
      "Evening Gowns",
      "Custom Design",
      "Alterations",
    ],
    title: "Bridal Couture & Wedding Specialists",
    leadTime: "6-8 weeks",
    consultationFee: 150.0,
  },
  "Wedding Guest": {
    specialties: [
      "Wedding Guest Attire",
      "Cocktail Dresses",
      "Formal Wear",
      "Occasion Wear",
    ],
    title: "Wedding Guest & Occasion Wear",
    leadTime: "3-4 weeks",
    consultationFee: 75.0,
  },
  "Event Wear": {
    specialties: [
      "Event Wear",
      "Formal Dresses",
      "Gala Attire",
      "Red Carpet",
      "Custom Design",
    ],
    title: "Event & Formal Wear Specialists",
    leadTime: "4-6 weeks",
    consultationFee: 100.0,
  },
  Birthday: {
    specialties: [
      "Birthday Outfits",
      "Party Wear",
      "Celebration Dresses",
      "Custom Design",
    ],
    title: "Birthday & Celebration Wear",
    leadTime: "2-3 weeks",
    consultationFee: 50.0,
  },
  "Custom Design": {
    specialties: [
      "Custom Design",
      "Bespoke Garments",
      "Made-to-Measure",
      "Alterations",
      "Personal Styling",
    ],
    title: "Custom Design & Bespoke Services",
    leadTime: "4-8 weeks",
    consultationFee: 125.0,
  },
};

async function migrateRealTailoredBrands() {
  console.log(
    "🚀 Starting migration of real Tailored category brands to tailors table...\n"
  );

  try {
    // First, clear existing sample tailors
    console.log("🧹 Clearing existing sample tailors...");
    const { error: deleteError } = await supabase
      .from("tailors")
      .delete()
      .neq("id", ""); // Delete all records

    if (deleteError) {
      console.error("❌ Error clearing existing tailors:", deleteError);
      // Continue anyway, as this might just mean the table is empty
    } else {
      console.log("✅ Cleared existing tailors");
    }

    // Fetch brands from tailored categories
    console.log("📋 Fetching brands from Tailored categories...");
    const { data: tailoredBrands, error: brandsError } = await supabase
      .from("brands")
      .select("*")
      .in("category", tailoredCategories);

    if (brandsError) {
      console.error("❌ Error fetching tailored brands:", brandsError);
      return;
    }

    console.log(
      `✅ Found ${tailoredBrands.length} brands in Tailored categories:`
    );
    tailoredBrands.forEach((brand) => {
      console.log(`   - ${brand.name} (${brand.category}) - ${brand.location}`);
    });
    console.log("");

    if (tailoredBrands.length === 0) {
      console.log(
        "⚠️  No brands found in Tailored categories. Make sure brands exist in your database."
      );
      return;
    }

    // Migrate each brand to tailors table
    let migratedCount = 0;
    let skippedCount = 0;

    for (const brand of tailoredBrands) {
      console.log(`🔄 Processing ${brand.name} (${brand.category})...`);

      const categoryConfig = categoryToSpecialties[brand.category];
      if (!categoryConfig) {
        console.log(
          `   ⚠️  No tailor configuration for category ${brand.category}, skipping...`
        );
        skippedCount++;
        continue;
      }

      // Create price range based on category
      let priceRange = "Contact for pricing";
      if (brand.price_range) {
        priceRange = brand.price_range;
      } else {
        // Generate appropriate price ranges based on category
        switch (brand.category) {
          case "Bridal":
            priceRange = "$1,500 - $8,000";
            break;
          case "Event Wear":
            priceRange = "$800 - $3,500";
            break;
          case "Wedding Guest":
            priceRange = "$400 - $1,500";
            break;
          case "Birthday":
            priceRange = "$300 - $1,200";
            break;
          case "Custom Design":
            priceRange = "$500 - $5,000";
            break;
        }
      }

      // Insert tailor record
      const { data: newTailor, error: insertError } = await supabase
        .from("tailors")
        .insert({
          brand_id: brand.id,
          title: brand.name,
          image: brand.image,
          description:
            brand.description ||
            `Specialized ${brand.category.toLowerCase()} designer creating beautiful, custom-fitted garments with attention to detail and exceptional craftsmanship.`,
          specialties: categoryConfig.specialties,
          price_range: priceRange,
          lead_time: categoryConfig.leadTime,
          consultation_fee: categoryConfig.consultationFee,
        })
        .select()
        .single();

      if (insertError) {
        console.log(`   ❌ Error inserting tailor: ${insertError.message}`);
        skippedCount++;
        continue;
      }

      console.log(`   ✅ Successfully added tailor: ${brand.name}`);
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
    console.log("\nMigrated Tailored brands:");
    allTailors.forEach((tailor) => {
      console.log(`   - ${tailor.title}`);
      console.log(
        `     Brand: ${tailor.brand.name} (${tailor.brand.category})`
      );
      console.log(`     Location: ${tailor.brand.location}`);
      console.log(
        `     Specialties: ${tailor.specialties?.join(", ") || "None"}`
      );
      console.log(`     Price Range: ${tailor.price_range || "Not specified"}`);
      console.log(`     Lead Time: ${tailor.lead_time || "Not specified"}`);
      console.log("");
    });

    console.log("🎉 Migration completed successfully!");
    console.log("\n💡 Next steps:");
    console.log("   1. Visit /tailors to see the real tailored brands");
    console.log(
      "   2. The 'Tailored' option on homepage now routes to /tailors"
    );
    console.log(
      "   3. All brands from Bridal, Wedding Guest, Event Wear, Birthday, and Custom Design categories are now available"
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrateRealTailoredBrands()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateRealTailoredBrands };
