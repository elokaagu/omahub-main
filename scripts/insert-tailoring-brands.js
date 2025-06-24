#!/usr/bin/env node

/**
 * Script to insert tailoring brands from static data into Supabase database
 * This needs to be run before the tailors migration
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

// Tailoring brands from the static data file
const tailoringBrands = [
  {
    id: "tunis-tailors",
    name: "Tunis Master Tailors",
    description:
      "Tunis Master Tailors offers bespoke tailoring services that blend Mediterranean and North African influences, creating impeccably crafted garments with a distinctly Tunisian sensibility.",
    long_description:
      "Founded in 1985 by master tailor Hamid Benali and now led by his son Karim, Tunis Master Tailors represents over three decades of excellence in bespoke tailoring. The atelier has built a reputation for exceptional craftsmanship that honors traditional Tunisian tailoring techniques while embracing contemporary styling.\n\nThe brand specializes in made-to-measure menswear, including suits, shirts, and formal wear that blend Mediterranean elegance with subtle North African details. Each garment is handcrafted in their Tunis workshop, where a team of skilled tailors – many of whom have been with the company for decades – ensure uncompromising quality.\n\nTunis Master Tailors sources fine fabrics from both European mills and local producers, offering clients an extensive selection of materials that range from classic wool suitings to lightweight linens perfect for the North African climate. Their commitment to personalized service includes multiple fittings to achieve the perfect fit.",
    location: "Tunis, Tunisia",
    price_range: "TND 800 - TND 5,000",
    category: "Tailoring",
    rating: 4.9,
    is_verified: true,
    image: "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
  },
  {
    id: "casablanca-cuts",
    name: "Casablanca Cuts",
    description:
      "Casablanca Cuts offers bespoke tailoring that combines Moroccan craftsmanship with contemporary fashion. Their pieces feature clean lines and impeccable attention to detail.",
    long_description:
      "Founded in 2019 by master tailor Hassan El Fassi, Casablanca Cuts has established itself as Morocco's leading bespoke tailoring house. The atelier combines traditional Moroccan craftsmanship with modern tailoring techniques to create garments of exceptional quality.\n\nTheir workshop in Casablanca brings together skilled artisans who specialize in both traditional and contemporary tailoring methods. Each piece is meticulously crafted to the client's specifications, ensuring perfect fit and superior quality.\n\nThe brand is particularly known for its innovative approach to menswear, offering traditional Moroccan garments with a modern twist as well as contemporary suits that incorporate subtle elements of Moroccan design. This unique fusion has attracted a diverse clientele, from business professionals to cultural creatives seeking something beyond conventional tailoring.",
    location: "Casablanca, Morocco",
    price_range: "MAD 5,000 - MAD 30,000",
    category: "Tailoring",
    rating: 4.8,
    is_verified: true,
    image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
  },
];

async function insertTailoringBrands() {
  console.log("🚀 Starting insertion of tailoring brands into database...\n");

  try {
    // Check existing brands
    console.log("🔍 Checking existing brands...");
    const { data: existingBrands, error: fetchError } = await supabase
      .from("brands")
      .select("id, name, category")
      .in(
        "id",
        tailoringBrands.map((b) => b.id)
      );

    if (fetchError) {
      console.error("❌ Error checking existing brands:", fetchError);
      return;
    }

    const existingIds = existingBrands?.map((b) => b.id) || [];
    console.log(`✅ Found ${existingIds.length} existing tailoring brands`);

    // Insert each brand
    let insertedCount = 0;
    let skippedCount = 0;

    for (const brand of tailoringBrands) {
      console.log(`🔄 Processing ${brand.name}...`);

      if (existingIds.includes(brand.id)) {
        console.log(`   ⚠️  Brand already exists, skipping...`);
        skippedCount++;
        continue;
      }

      const { data: newBrand, error: insertError } = await supabase
        .from("brands")
        .insert({
          id: brand.id,
          name: brand.name,
          description: brand.description,
          long_description: brand.long_description,
          location: brand.location,
          price_range: brand.price_range,
          category: brand.category,
          rating: brand.rating,
          is_verified: brand.is_verified,
          image: brand.image,
        })
        .select()
        .single();

      if (insertError) {
        console.log(`   ❌ Error inserting brand: ${insertError.message}`);
        continue;
      }

      console.log(`   ✅ Successfully inserted: ${brand.name}`);
      insertedCount++;
    }

    console.log("\n📊 Insertion Summary:");
    console.log(`   ✅ Successfully inserted: ${insertedCount} brands`);
    console.log(`   ⚠️  Skipped: ${skippedCount} brands`);

    // Verify insertion
    console.log("\n🔍 Verifying insertion...");
    const { data: allTailoringBrands, error: verifyError } = await supabase
      .from("brands")
      .select("id, name, category, location")
      .eq("category", "Tailoring");

    if (verifyError) {
      console.error("❌ Error verifying insertion:", verifyError);
      return;
    }

    console.log(
      `✅ Total tailoring brands in database: ${allTailoringBrands?.length || 0}`
    );
    allTailoringBrands?.forEach((brand) => {
      console.log(`   - ${brand.name} (${brand.location})`);
    });

    console.log("\n🎉 Brand insertion completed successfully!");
    console.log(
      "\n💡 Next step: Run 'npm run migrate:tailors' to add these brands to the tailors table"
    );
  } catch (error) {
    console.error("❌ Brand insertion failed:", error);
    process.exit(1);
  }
}

// Run the insertion
if (require.main === module) {
  insertTailoringBrands()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Brand insertion failed:", error);
      process.exit(1);
    });
}

module.exports = { insertTailoringBrands };
