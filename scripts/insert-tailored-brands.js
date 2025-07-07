#!/usr/bin/env node

/**
 * Script to insert tailored brands from static data into Supabase database
 * This script creates brands with category "Tailored" and their associated products
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tailored brands from the static data file
const tailoredBrands = [
  {
    id: "tunis-tailors",
    name: "Tunis Master Tailors",
    description:
      "Tunis Master Tailors offers bespoke tailored services that blend Mediterranean and North African influences, creating impeccably crafted garments with a distinctly Tunisian sensibility.",
    long_description:
      "Established in 1992, Tunis Master Tailors has been a cornerstone of Tunisian fashion for over three decades of excellence in bespoke tailored. The atelier has built a reputation for exceptional craftsmanship that honors traditional Tunisian tailored techniques while embracing contemporary styling.\n\nThe brand specializes in made-to-measure menswear, including suits, shirts, and formal wear that blend Mediterranean elegance with subtle North African influences. Each piece is meticulously crafted using premium fabrics sourced from renowned mills across Europe and North Africa.",
    location: "Tunis, Tunisia",
    price_range: "$$$$",
    category: "Tailored",
    rating: 4.9,
    is_verified: true,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
    website: "https://tunismasters.tn",
    instagram: "@tunismasters",
    whatsapp: "+216-71-123-456",
    founded_year: "1992",
  },
  {
    id: "casablanca-cuts",
    name: "Casablanca Cuts",
    description:
      "Casablanca Cuts offers bespoke tailored that combines Moroccan craftsmanship with contemporary fashion. Their pieces feature clean lines and impeccable attention to detail.",
    long_description:
      "Founded in 2019 by master tailor Hassan El Fassi, Casablanca Cuts has established itself as Morocco's leading bespoke tailored house. The atelier combines traditional Moroccan craftsmanship with modern tailored techniques to create garments of exceptional quality.\n\nTheir workshop in Casablanca brings together skilled artisans who specialize in both traditional and contemporary tailored methods. Each piece is meticulously crafted to the client's specifications, ensuring perfect fit and superior quality.\n\nThe brand is particularly known for its innovative approach to menswear, creating pieces that honor Moroccan heritage while appealing to modern sensibilities. Their clientele includes diplomats, business leaders, and fashion-conscious individuals seeking something beyond conventional tailored.",
    location: "Casablanca, Morocco",
    price_range: "$$$$",
    category: "Tailored",
    rating: 4.8,
    is_verified: true,
    image:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=600&fit=crop",
    website: "https://casablancacuts.ma",
    instagram: "@casablancacuts",
    whatsapp: "+212-522-123-456",
    founded_year: "2019",
  },
];

async function insertTailoredBrands() {
  console.log("🚀 Starting insertion of tailored brands into database...\n");

  try {
    // Check if brands already exist
    const { data: existingBrands, error: checkError } = await supabase
      .from("brands")
      .select("id")
      .in(
        "id",
        tailoredBrands.map((b) => b.id)
      );

    if (checkError) {
      throw checkError;
    }

    const existingIds = existingBrands?.map((b) => b.id) || [];
    console.log(`✅ Found ${existingIds.length} existing tailored brands`);

    // Insert brands that don't exist
    const brandsToInsert = tailoredBrands.filter(
      (brand) => !existingIds.includes(brand.id)
    );

    for (const brand of tailoredBrands) {
      if (existingIds.includes(brand.id)) {
        console.log(`⏭️  Skipping existing brand: ${brand.name}`);
        continue;
      }

      console.log(`📝 Inserting brand: ${brand.name}`);

      const { data: insertedBrand, error: insertError } = await supabase
        .from("brands")
        .insert([
          {
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
            website: brand.website,
            instagram: brand.instagram,
            whatsapp: brand.whatsapp,
            founded_year: brand.founded_year,
          },
        ])
        .select();

      if (insertError) {
        console.error(`❌ Error inserting brand ${brand.name}:`, insertError);
        continue;
      }

      console.log(`✅ Successfully inserted brand: ${brand.name}`);
    }

    // Verify insertion
    const { data: allTailoredBrands, error: verifyError } = await supabase
      .from("brands")
      .select("id, name, category, location, rating")
      .eq("category", "Tailored");

    if (verifyError) {
      throw verifyError;
    }

    console.log(
      `✅ Total tailored brands in database: ${allTailoredBrands?.length || 0}`
    );
    allTailoredBrands?.forEach((brand) => {
      console.log(
        `   - ${brand.name} (${brand.location}) - Rating: ${brand.rating}`
      );
    });

    console.log("\n🎉 Tailored brands insertion completed successfully!");
  } catch (error) {
    console.error("❌ Error during tailored brands insertion:", error);
    process.exit(1);
  }
}

// Run the insertion
insertTailoredBrands()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

module.exports = { insertTailoredBrands };
