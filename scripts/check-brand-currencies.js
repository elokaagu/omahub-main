import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBrandCurrencies() {
  console.log("🔍 Checking brand currencies...\n");

  try {
    // Get all brands with their location and currency info
    const { data: brands, error } = await supabase
      .from("brands")
      .select("id, name, location, currency, price_range")
      .order("name");

    if (error) {
      console.error("❌ Error fetching brands:", error);
      return;
    }

    console.log(`📊 Found ${brands.length} brands\n`);

    let brandsWithCurrency = 0;
    let brandsWithoutCurrency = 0;
    let brandsWithLocation = 0;
    let brandsWithoutLocation = 0;

    const brandsNeedingCurrency = [];

    brands.forEach((brand, index) => {
      console.log(`${index + 1}. ${brand.name}`);
      console.log(`   Location: ${brand.location || "None"}`);
      console.log(`   Currency: ${brand.currency || "None"}`);
      console.log(`   Price Range: ${brand.price_range || "None"}`);

      if (brand.currency) {
        brandsWithCurrency++;
      } else {
        brandsWithoutCurrency++;
        brandsNeedingCurrency.push(brand);
      }

      if (brand.location) {
        brandsWithLocation++;
      } else {
        brandsWithoutLocation++;
      }

      console.log("");
    });

    console.log("📈 SUMMARY:");
    console.log(`✅ Brands with currency: ${brandsWithCurrency}`);
    console.log(`❌ Brands without currency: ${brandsWithoutCurrency}`);
    console.log(`✅ Brands with location: ${brandsWithLocation}`);
    console.log(`❌ Brands without location: ${brandsWithoutLocation}`);

    if (brandsNeedingCurrency.length > 0) {
      console.log("\n🔧 BRANDS NEEDING CURRENCY:");
      brandsNeedingCurrency.forEach((brand) => {
        console.log(`- ${brand.name} (${brand.location || "No location"})`);
      });

      console.log("\n💡 RECOMMENDATIONS:");
      console.log("1. Set explicit currency for brands without one");
      console.log("2. Ensure all brands have location set");
      console.log("3. Use currency codes: NGN (₦), GHS, USD ($), EUR (€), etc.");
    }

    // Test currency detection for a few brands
    console.log("\n🧪 TESTING CURRENCY DETECTION:");
    const testBrands = brands.slice(0, 5);
    
    for (const brand of testBrands) {
      if (brand.location) {
        const { data: currencyData } = await supabase.rpc('get_currency_by_location', { 
          location: brand.location 
        });
        console.log(`${brand.name}: Location "${brand.location}" -> Currency: ${currencyData || "Not detected"}`);
      }
    }

  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkBrandCurrencies();
