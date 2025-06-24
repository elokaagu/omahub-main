const { getAllBrands } = require("../lib/services/brandService");

async function checkAllAccessories() {
  try {
    console.log("🔍 Checking all accessories brands in database...\n");

    const brands = await getAllBrands();
    const accessories = brands.filter((b) => b.category === "Accessories");

    console.log(`✅ Found ${accessories.length} accessories brands:\n`);

    accessories.forEach((brand, i) => {
      console.log(`${i + 1}. ${brand.name}`);
      console.log(`   - ID: ${brand.id}`);
      console.log(`   - Location: ${brand.location}`);
      console.log(`   - Rating: ★${brand.rating}`);
      console.log(`   - Verified: ${brand.is_verified ? "✅" : "❌"}`);
      console.log(`   - Image: ${brand.image}`);
      console.log("");
    });

    console.log(`📊 Summary: ${accessories.length} accessories brands total`);
  } catch (error) {
    console.error("❌ Error checking accessories brands:", error);
  }
}

checkAllAccessories();
