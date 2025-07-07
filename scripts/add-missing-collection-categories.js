const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  console.log("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample brands for missing categories
const missingCategoryBrands = [
  // Luxury brands
  {
    id: "luxury-brand-1",
    name: "Atelier Luxe",
    category: "Luxury",
    location: "Lagos, Nigeria",
    description:
      "High-end luxury fashion house specializing in bespoke couture",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.9,
    contact_email: "info@atelierluxe.com",
    whatsapp: "+234123456789",
  },
  {
    id: "luxury-brand-2",
    name: "Maison Elegance",
    category: "Luxury",
    location: "Abuja, Nigeria",
    description:
      "Luxury fashion brand creating timeless pieces for discerning clients",
    image:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.8,
    contact_email: "hello@maisonelegance.com",
    whatsapp: "+234123456790",
  },

  // Couture brands
  {
    id: "couture-brand-1",
    name: "Bespoke Atelier",
    category: "Couture",
    location: "Lagos, Nigeria",
    description:
      "Made-to-measure specialists creating perfectly fitted garments",
    image:
      "https://images.unsplash.com/photo-1566479179817-c0b5b4b4b1e5?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.7,
    contact_email: "orders@bespokeatelier.com",
    whatsapp: "+234123456791",
  },
  {
    id: "couture-brand-2",
    name: "Couture Craft",
    category: "Couture",
    location: "Port Harcourt, Nigeria",
    description: "Custom design house specializing in made-to-measure fashion",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.6,
    contact_email: "info@couturecraft.com",
    whatsapp: "+234123456792",
  },

  // Streetwear brands
  {
    id: "streetwear-brand-1",
    name: "Urban Vibe",
    category: "Streetwear",
    location: "Lagos, Nigeria",
    description: "Contemporary streetwear brand with urban African influences",
    image:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.5,
    contact_email: "hello@urbanvibe.com",
    whatsapp: "+234123456793",
  },
  {
    id: "streetwear-brand-2",
    name: "Street Culture",
    category: "Streetwear",
    location: "Abuja, Nigeria",
    description: "Bold streetwear designs for the modern African youth",
    image:
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.4,
    contact_email: "info@streetculture.com",
    whatsapp: "+234123456794",
  },
];

async function addMissingCategoryBrands() {
  console.log("🔄 Adding brands to missing collection categories...\n");

  try {
    // First, check current categories
    console.log("1. Checking current brand categories...");
    const { data: currentBrands, error: fetchError } = await supabase
      .from("brands")
      .select("category")
      .not("category", "is", null);

    if (fetchError) {
      console.error("❌ Error fetching current brands:", fetchError);
      return;
    }

    const currentCategories = [
      ...new Set(currentBrands.map((b) => b.category)),
    ];
    console.log("Current categories:", currentCategories);

    // Check which categories are missing
    const targetCategories = ["Luxury", "Couture", "Streetwear"];
    const missingCategories = targetCategories.filter(
      (cat) => !currentCategories.includes(cat)
    );

    console.log("Missing categories:", missingCategories);

    if (missingCategories.length === 0) {
      console.log("✅ All collection categories already have brands!");
      return;
    }

    // Add brands for missing categories
    console.log("\n2. Adding brands for missing categories...");

    for (const brand of missingCategoryBrands) {
      if (missingCategories.includes(brand.category)) {
        console.log(`Adding ${brand.name} (${brand.category})...`);

        const { error: insertError } = await supabase
          .from("brands")
          .insert(brand);

        if (insertError) {
          if (insertError.code === "23505") {
            console.log(
              `  ⚠️  Brand ${brand.name} already exists, skipping...`
            );
          } else {
            console.error(`  ❌ Error adding ${brand.name}:`, insertError);
          }
        } else {
          console.log(`  ✅ Added ${brand.name} successfully`);
        }
      }
    }

    // Verify the results
    console.log("\n3. Verifying results...");
    const { data: updatedBrands, error: verifyError } = await supabase
      .from("brands")
      .select("category")
      .not("category", "is", null);

    if (verifyError) {
      console.error("❌ Error verifying results:", verifyError);
      return;
    }

    const updatedCategories = [
      ...new Set(updatedBrands.map((b) => b.category)),
    ];
    const categoryCounts = {};
    updatedBrands.forEach((brand) => {
      categoryCounts[brand.category] =
        (categoryCounts[brand.category] || 0) + 1;
    });

    console.log("\n📊 Updated category counts:");
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} brands`);
    });

    console.log("\n✅ Missing collection categories have been added!");
    console.log("🔄 The Collections dropdown should now show all options.");
    console.log("💡 You may need to refresh your browser to see the changes.");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

addMissingCategoryBrands();
