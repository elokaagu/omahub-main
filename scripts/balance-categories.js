require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function balanceCategories() {
  try {
    console.log("🔄 Balancing categories for optimal homepage display...");

    // First, let's see what brands we have
    const { data: brands, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching brands:", error);
      return;
    }

    console.log(`📊 Total brands found: ${brands.length}\n`);

    // Let's create a balanced distribution with 4 categories having 4+ brands each
    // We have 18 brands total, so we can have 4 categories with 4-5 brands each

    const updates = [
      // Ready to Wear (4 brands)
      {
        id: brands.find((b) => b.name === "Kai Collective")?.id,
        category: "Ready to Wear",
      },
      {
        id: brands.find((b) => b.name === "Cisca Cecil")?.id,
        category: "Ready to Wear",
      },
      {
        id: brands.find((b) => b.name === "Anko")?.id,
        category: "Ready to Wear",
      },
      {
        id: brands.find((b) => b.name === "The Ivy Mark")?.id,
        category: "Ready to Wear",
      },

      // Streetwear (4 brands)
      {
        id: brands.find((b) => b.name === "Rendoll")?.id,
        category: "Streetwear & Urban",
      },
      {
        id: brands.find((b) => b.name === "Mairachamp")?.id,
        category: "Streetwear & Urban",
      },
      {
        id: brands.find((b) => b.name === "Imaulé")?.id,
        category: "Streetwear & Urban",
      },
      {
        id: brands.find((b) => b.name === "Swim and Dream")?.id,
        category: "Streetwear & Urban",
      },

      // Accessories (5 brands)
      {
        id: brands.find((b) => b.name === "ANDREA IYAMAH")?.id,
        category: "Accessories",
      },
      {
        id: brands.find((b) => b.name === "Kisara")?.id,
        category: "Accessories",
      },
      {
        id: brands.find((b) => b.name === "Ehbs Couture")?.id,
        category: "Accessories",
      },
      {
        id: brands.find((b) => b.name === "Style Envie")?.id,
        category: "Accessories",
      },
      {
        id: brands.find((b) => b.name === "Adesilver Spitalfields")?.id,
        category: "Accessories",
      },

      // Bridal (4 brands) - Keep as is
      {
        id: brands.find((b) => b.name === "54 Stitches")?.id,
        category: "Bridal",
      },
      {
        id: brands.find((b) => b.name === "Kyan Atelier")?.id,
        category: "Bridal",
      },
      { id: brands.find((b) => b.name === "Malité")?.id, category: "Bridal" },
      {
        id: brands.find((b) => b.name === "Rebecca Tembo")?.id,
        category: "Bridal",
      },

      // Formal Wear (1 brand) - Keep as is
      {
        id: brands.find((b) => b.name === "Melira")?.id,
        category: "Formal Wear",
      },
    ].filter((update) => update.id); // Only include updates where we found the brand

    console.log("🔄 Updating brand categories...");

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("brands")
        .update({
          category: update.category,
          updated_at: new Date().toISOString(),
        })
        .eq("id", update.id);

      if (updateError) {
        console.error(`Error updating brand ${update.id}:`, updateError);
      } else {
        const brand = brands.find((b) => b.id === update.id);
        console.log(`✅ Updated ${brand.name} -> ${update.category}`);
      }
    }

    console.log("\n🔄 Fetching updated data...");

    // Now let's check the updated categories
    const { data: updatedBrands, error: fetchError } = await supabase
      .from("brands")
      .select("*")
      .order("name");

    if (fetchError) {
      console.error("Error fetching updated brands:", fetchError);
      return;
    }

    // Group by category
    const categoryBrands = {};
    updatedBrands.forEach((brand) => {
      const category = brand.category || "Uncategorized";
      if (!categoryBrands[category]) {
        categoryBrands[category] = [];
      }
      categoryBrands[category].push(brand.name);
    });

    console.log("\n📋 Updated category breakdown:");
    Object.entries(categoryBrands)
      .sort(([, a], [, b]) => b.length - a.length)
      .forEach(([category, brandList]) => {
        const status = brandList.length >= 4 ? "✅" : "❌";
        console.log(`\n${status} ${category} (${brandList.length} brands):`);
        brandList.forEach((brand) => console.log(`   - ${brand}`));
      });

    // Summary
    const categoriesWith4Plus = Object.entries(categoryBrands)
      .filter(([, brands]) => brands.length >= 4)
      .map(([category]) => category);

    console.log("\n🎯 SUMMARY:");
    console.log(`Categories with 4+ brands: ${categoriesWith4Plus.length}`);
    console.log("Categories that will show on homepage:", categoriesWith4Plus);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the function
balanceCategories();
