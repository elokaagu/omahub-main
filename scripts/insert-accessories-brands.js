const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Accessories brands from the static data
const accessoriesBrands = [
  {
    id: "beads-by-nneka",
    name: "Beads by Nneka",
    description:
      "Beads by Nneka creates exquisite handcrafted jewelry that celebrates Nigerian heritage through contemporary designs, using traditional beading techniques passed down through generations.",
    long_description:
      "Founded in 2017 by Nigerian artisan Nneka Okafor, Beads by Nneka has established itself as a premier handcrafted jewelry brand that honors traditional Nigerian beading techniques while creating pieces with contemporary appeal. Each item is handmade in Nneka's Abuja studio, where she leads a small team of skilled artisans.\n\nThe brand is known for its innovative use of traditional materials including coral, brass, and glass beads, often sourced locally and arranged in patterns inspired by various Nigerian cultures. While honoring traditional techniques, the designs feature modern sensibilities that appeal to fashion-forward clients globally.\n\nBeads by Nneka has gained recognition for its commitment to preserving Nigerian craft traditions while creating sustainable employment opportunities for local artisans. Each piece comes with information about its cultural inspiration, connecting wearers to the rich heritage behind their jewelry.",
    location: "Abuja, Nigeria",
    price_range: "₦15,000 - ₦250,000",
    category: "Accessories",
    rating: 4.9,
    is_verified: true,
    image: "/lovable-uploads/b3fb585e-93cf-4aa7-9204-0a1b477fcb06.png",
  },
  {
    id: "marrakech-textiles",
    name: "Marrakech Textiles",
    description:
      "Marrakech Textiles creates handwoven accessories that celebrate Morocco's rich textile heritage, offering contemporary interpretations of traditional patterns and techniques.",
    long_description:
      "Established in 2015 by Moroccan designer Leila Bensouda, Marrakech Textiles has revitalized traditional Moroccan weaving techniques by creating contemporary accessories that appeal to global markets. The brand works with over fifty artisans across Morocco, preserving ancient craft traditions while providing sustainable livelihoods.\n\nThe brand specializes in handwoven scarves, shawls, and home textiles that feature intricate patterns inspired by Morocco's diverse cultural heritage. Each piece is handcrafted using traditional looms, with designs that range from classic Moroccan motifs to innovative contemporary interpretations.\n\nMarrakech Textiles places a strong emphasis on sustainable production, using natural fibers and dyes whenever possible. The brand has gained recognition for its ethical practices and for creating a bridge between traditional craftsmanship and contemporary design sensibilities.",
    location: "Marrakech, Morocco",
    price_range: "MAD 300 - MAD 3,000",
    category: "Accessories",
    rating: 4.7,
    is_verified: false,
    image: "/lovable-uploads/ee92bbfa-4f54-4567-b4ef-8aebd0bca695.png",
  },
  {
    id: "kente-collective",
    name: "Kente Collective",
    description:
      "Authentic Ghanaian kente accessories and home decor crafted by skilled artisans using traditional techniques and designs.",
    long_description:
      "Kente Collective was established in 2016 to preserve and promote authentic Ghanaian kente craftsmanship while creating economic opportunities for traditional weavers. All products are handwoven using centuries-old techniques by artisans in the Ashanti and Volta regions of Ghana.\n\nThe collective works directly with master weavers who have inherited their skills through generations of family tradition. Each piece tells a story through its patterns and colors, with designs that carry cultural significance and meaning within Ghanaian society.\n\nKente Collective is committed to fair trade practices, ensuring that artisans receive fair compensation for their work while helping to preserve this important cultural heritage for future generations.",
    location: "Accra, Ghana",
    price_range: "GH₵100 - GH₵2,000",
    category: "Accessories",
    rating: 4.7,
    is_verified: true,
    image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
  },
  {
    id: "shekudo",
    name: "Shekudo",
    description: "Handcrafted accessories made with local materials.",
    long_description:
      "Shekudo creates beautiful handcrafted accessories using locally sourced materials and traditional techniques. Each piece is carefully crafted to celebrate African artistry and craftsmanship.",
    location: "Nairobi, Kenya",
    price_range: "KSh 2,000 - KSh 25,000",
    category: "Accessories",
    rating: 4.7,
    is_verified: true,
    image: "/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png",
  },
];

async function insertAccessoriesBrands() {
  try {
    console.log("🔄 Starting accessories brands insertion...");

    for (const brand of accessoriesBrands) {
      console.log(`\n📦 Processing ${brand.name}...`);

      // Check if brand already exists
      const { data: existingBrand, error: checkError } = await supabase
        .from("brands")
        .select("id")
        .eq("id", brand.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error(`❌ Error checking brand ${brand.id}:`, checkError);
        continue;
      }

      if (existingBrand) {
        console.log(`⚠️  Brand ${brand.name} already exists, skipping...`);
        continue;
      }

      // Insert the brand
      const { data: insertedBrand, error: insertError } = await supabase
        .from("brands")
        .insert([brand])
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Error inserting brand ${brand.name}:`, insertError);
        continue;
      }

      console.log(`✅ Successfully inserted ${brand.name}`);
    }

    // Verify the insertion
    const { data: accessoriesBrandsCount, error: countError } = await supabase
      .from("brands")
      .select("id, name")
      .eq("category", "Accessories");

    if (countError) {
      console.error("❌ Error counting accessories brands:", countError);
    } else {
      console.log(
        `\n🎉 Total accessories brands in database: ${accessoriesBrandsCount.length}`
      );
      accessoriesBrandsCount.forEach((brand) => {
        console.log(`   - ${brand.name}`);
      });
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the script
insertAccessoriesBrands()
  .then(() => {
    console.log("\n✅ Accessories brands insertion completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
