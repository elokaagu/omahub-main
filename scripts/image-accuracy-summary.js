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

async function imageAccuracySummary() {
  try {
    console.log("🎯 COMPREHENSIVE IMAGE ACCURACY SUMMARY");
    console.log("=".repeat(50));

    // 1. Check Brands
    console.log("\n🏷️ BRAND IMAGES:");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, image");

    if (!brandsError && brands) {
      const uniqueBrandImages = new Set(
        brands.filter((b) => b.image).map((b) => b.image)
      );
      console.log(`   📊 Total Brands: ${brands.length}`);
      console.log(`   🖼️ Unique Images: ${uniqueBrandImages.size}`);
      console.log(
        `   🔄 Duplicates: ${brands.length - uniqueBrandImages.size}`
      );
      console.log(
        `   ✅ Status: ${brands.length === uniqueBrandImages.size ? "PERFECT" : "NEEDS FIXING"}`
      );
    }

    // 2. Check Products
    console.log("\n📦 PRODUCT IMAGES:");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, image");

    if (!productsError && products) {
      const uniqueProductImages = new Set(
        products.filter((p) => p.image).map((p) => p.image)
      );
      console.log(`   📊 Total Products: ${products.length}`);
      console.log(`   🖼️ Unique Images: ${uniqueProductImages.size}`);
      console.log(
        `   🔄 Duplicates: ${products.length - uniqueProductImages.size}`
      );
      console.log(
        `   ✅ Status: ${products.length === uniqueProductImages.size ? "PERFECT" : "NEEDS FIXING"}`
      );
    }

    // 3. Check Service Products
    console.log("\n🔧 SERVICE PRODUCT IMAGES:");
    if (products) {
      const serviceKeywords = [
        "service",
        "consultation",
        "alteration",
        "fitting",
        "custom",
        "tailoring",
        "repair",
      ];
      const serviceProducts = products.filter((product) => {
        const title = product.title?.toLowerCase() || "";
        return serviceKeywords.some((keyword) => title.includes(keyword));
      });

      const uniqueServiceImages = new Set(
        serviceProducts.filter((p) => p.image).map((p) => p.image)
      );
      console.log(`   📊 Total Service Products: ${serviceProducts.length}`);
      console.log(`   🖼️ Unique Images: ${uniqueServiceImages.size}`);
      console.log(
        `   🔄 Duplicates: ${serviceProducts.length - uniqueServiceImages.size}`
      );
      console.log(
        `   ✅ Status: ${serviceProducts.length === uniqueServiceImages.size ? "PERFECT" : "NEEDS FIXING"}`
      );
    }

    // 4. Check Tailors
    console.log("\n👔 TAILOR IMAGES:");
    const { data: tailors, error: tailorsError } = await supabase
      .from("tailors")
      .select("id, title, image");

    if (!tailorsError && tailors) {
      const uniqueTailorImages = new Set(
        tailors.filter((t) => t.image).map((t) => t.image)
      );
      console.log(`   📊 Total Tailors: ${tailors.length}`);
      console.log(`   🖼️ Unique Images: ${uniqueTailorImages.size}`);
      console.log(
        `   🔄 Duplicates: ${tailors.length - uniqueTailorImages.size}`
      );
      console.log(
        `   ✅ Status: ${tailors.length === uniqueTailorImages.size ? "PERFECT" : "NEEDS FIXING"}`
      );
    }

    // 5. Check Catalogues/Collections
    console.log("\n📚 COLLECTION IMAGES:");
    const { data: catalogues, error: cataloguesError } = await supabase
      .from("catalogues")
      .select("id, title, image");

    if (!cataloguesError && catalogues) {
      const uniqueCatalogueImages = new Set(
        catalogues.filter((c) => c.image).map((c) => c.image)
      );
      console.log(`   📊 Total Catalogues: ${catalogues.length}`);
      console.log(`   🖼️ Unique Images: ${uniqueCatalogueImages.size}`);
      console.log(
        `   🔄 Duplicates: ${catalogues.length - uniqueCatalogueImages.size}`
      );
      console.log(
        `   ✅ Status: ${catalogues.length === uniqueCatalogueImages.size ? "PERFECT" : "NEEDS FIXING"}`
      );
    }

    // 6. Overall Summary
    console.log("\n" + "=".repeat(50));
    console.log("🎯 OVERALL IMAGE ACCURACY STATUS:");

    let totalItems = 0;
    let totalUniqueImages = 0;
    let totalDuplicates = 0;

    if (brands) {
      const uniqueBrandImages = new Set(
        brands.filter((b) => b.image).map((b) => b.image)
      );
      totalItems += brands.length;
      totalUniqueImages += uniqueBrandImages.size;
      totalDuplicates += brands.length - uniqueBrandImages.size;
    }

    if (products) {
      const uniqueProductImages = new Set(
        products.filter((p) => p.image).map((p) => p.image)
      );
      totalItems += products.length;
      totalUniqueImages += uniqueProductImages.size;
      totalDuplicates += products.length - uniqueProductImages.size;
    }

    if (tailors) {
      const uniqueTailorImages = new Set(
        tailors.filter((t) => t.image).map((t) => t.image)
      );
      totalItems += tailors.length;
      totalUniqueImages += uniqueTailorImages.size;
      totalDuplicates += tailors.length - uniqueTailorImages.size;
    }

    if (catalogues) {
      const uniqueCatalogueImages = new Set(
        catalogues.filter((c) => c.image).map((c) => c.image)
      );
      totalItems += catalogues.length;
      totalUniqueImages += uniqueCatalogueImages.size;
      totalDuplicates += catalogues.length - uniqueCatalogueImages.size;
    }

    console.log(`   📊 Total Items: ${totalItems}`);
    console.log(`   🖼️ Total Unique Images: ${totalUniqueImages}`);
    console.log(`   🔄 Total Duplicates: ${totalDuplicates}`);
    console.log(
      `   📈 Accuracy Rate: ${totalItems > 0 ? Math.round(((totalItems - totalDuplicates) / totalItems) * 100) : 0}%`
    );

    if (totalDuplicates === 0) {
      console.log(`   🎉 STATUS: ALL IMAGES ARE PERFECT! 🎉`);
    } else {
      console.log(`   ⚠️ STATUS: ${totalDuplicates} IMAGES NEED FIXING`);
    }

    console.log("\n" + "=".repeat(50));
  } catch (error) {
    console.error("❌ Error in imageAccuracySummary:", error);
  }
}

// Run the summary
imageAccuracySummary()
  .then(() => {
    console.log("\n🏁 Summary completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Summary failed:", error);
    process.exit(1);
  });
