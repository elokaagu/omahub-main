/**
 * Add Sample Products to Test Brand
 *
 * This script adds realistic product data to demonstrate the enhanced
 * revenue estimation system using real brand product pricing.
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_BRAND_ID = "550e8400-e29b-41d4-a716-446655440001";

const sampleProducts = [
  // Wedding & Bridal Collection
  {
    brand_id: TEST_BRAND_ID,
    title: "Elegant Silk Wedding Gown",
    description: "Custom-made silk wedding dress with hand-beaded details",
    price: 8500,
    sale_price: null,
    category: "wedding",
    in_stock: true,
    sizes: ["2", "4", "6", "8", "10", "12", "14"],
    colors: ["Ivory", "White", "Champagne"],
    materials: ["Silk", "Lace", "Beading"],
    is_custom: true,
    lead_time: "12-16 weeks",
  },
  {
    brand_id: TEST_BRAND_ID,
    title: "Classic A-Line Bridal Dress",
    description: "Timeless A-line wedding dress in luxurious satin",
    price: 6200,
    sale_price: 5500,
    category: "wedding",
    in_stock: true,
    sizes: ["0", "2", "4", "6", "8", "10", "12"],
    colors: ["White", "Ivory"],
    materials: ["Satin", "Tulle"],
    is_custom: false,
    lead_time: "6-8 weeks",
  },
  {
    brand_id: TEST_BRAND_ID,
    title: "Bohemian Wedding Dress",
    description: "Free-spirited lace wedding dress with flowing silhouette",
    price: 4800,
    sale_price: null,
    category: "wedding",
    in_stock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Ivory", "Blush", "Nude"],
    materials: ["Lace", "Chiffon"],
    is_custom: false,
    lead_time: "4-6 weeks",
  },

  // Evening & Formal Collection
  {
    brand_id: TEST_BRAND_ID,
    title: "Red Carpet Gala Gown",
    description: "Show-stopping evening gown with crystal embellishments",
    price: 12000,
    sale_price: null,
    category: "evening",
    in_stock: true,
    sizes: ["0", "2", "4", "6", "8"],
    colors: ["Black", "Navy", "Emerald", "Burgundy"],
    materials: ["Silk", "Crystals", "Beading"],
    is_custom: true,
    lead_time: "8-12 weeks",
  },
  {
    brand_id: TEST_BRAND_ID,
    title: "Cocktail Party Dress",
    description: "Sophisticated midi dress perfect for cocktail events",
    price: 2800,
    sale_price: null,
    category: "evening",
    in_stock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Black", "Navy", "Wine", "Forest Green"],
    materials: ["Crepe", "Silk"],
    is_custom: false,
    lead_time: "2-3 weeks",
  },
  {
    brand_id: TEST_BRAND_ID,
    title: "Black Tie Evening Gown",
    description: "Floor-length formal gown for black tie events",
    price: 5500,
    sale_price: 4800,
    category: "evening",
    in_stock: true,
    sizes: ["2", "4", "6", "8", "10", "12"],
    colors: ["Black", "Midnight Blue", "Deep Purple"],
    materials: ["Velvet", "Silk"],
    is_custom: false,
    lead_time: "4-5 weeks",
  },

  // Corporate & Professional Collection
  {
    brand_id: TEST_BRAND_ID,
    title: "Executive Power Suit",
    description: "Tailored business suit for the modern executive",
    price: 3200,
    sale_price: null,
    category: "corporate",
    in_stock: true,
    sizes: ["0", "2", "4", "6", "8", "10", "12", "14"],
    colors: ["Charcoal", "Navy", "Black", "Camel"],
    materials: ["Wool", "Silk Lining"],
    is_custom: true,
    lead_time: "6-8 weeks",
  },
  {
    brand_id: TEST_BRAND_ID,
    title: "Professional Blazer",
    description: "Versatile blazer for business and formal occasions",
    price: 1800,
    sale_price: null,
    category: "corporate",
    in_stock: true,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Navy", "Grey", "Cream"],
    materials: ["Wool Blend", "Cotton"],
    is_custom: false,
    lead_time: "2-3 weeks",
  },

  // Custom & Bespoke Collection
  {
    brand_id: TEST_BRAND_ID,
    title: "Bespoke Couture Gown",
    description: "One-of-a-kind custom gown designed specifically for you",
    price: 15000,
    sale_price: null,
    category: "custom",
    in_stock: true,
    sizes: ["Custom Fit"],
    colors: ["Custom Color"],
    materials: ["Premium Fabrics", "Hand Embellishments"],
    is_custom: true,
    lead_time: "16-20 weeks",
  },
  {
    brand_id: TEST_BRAND_ID,
    title: "Made-to-Measure Suit",
    description: "Perfectly fitted suit tailored to your measurements",
    price: 4500,
    sale_price: null,
    category: "custom",
    in_stock: true,
    sizes: ["Custom Fit"],
    colors: ["Navy", "Charcoal", "Black", "Brown"],
    materials: ["Italian Wool", "Silk Lining"],
    is_custom: true,
    lead_time: "8-10 weeks",
  },

  // Ready-to-Wear Collection
  {
    brand_id: TEST_BRAND_ID,
    title: "Designer Day Dress",
    description: "Elegant ready-to-wear dress for daytime events",
    price: 1200,
    sale_price: 950,
    category: "casual",
    in_stock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Navy", "Black", "Burgundy", "Forest"],
    materials: ["Jersey", "Cotton Blend"],
    is_custom: false,
    lead_time: "1-2 weeks",
  },
  {
    brand_id: TEST_BRAND_ID,
    title: "Casual Elegant Blouse",
    description: "Versatile silk blouse for professional and casual wear",
    price: 650,
    sale_price: null,
    category: "casual",
    in_stock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["White", "Cream", "Light Blue", "Blush"],
    materials: ["Silk", "Cotton"],
    is_custom: false,
    lead_time: "1 week",
  },

  // Consultation Services
  {
    brand_id: TEST_BRAND_ID,
    title: "Personal Styling Consultation",
    description: "One-on-one styling session with our design team",
    price: 500,
    sale_price: null,
    category: "consultation",
    in_stock: true,
    sizes: ["N/A"],
    colors: ["N/A"],
    materials: ["Service"],
    is_custom: false,
    lead_time: "1-2 weeks",
  },
  {
    brand_id: TEST_BRAND_ID,
    title: "Wardrobe Planning Session",
    description: "Comprehensive wardrobe analysis and planning service",
    price: 800,
    sale_price: 650,
    category: "consultation",
    in_stock: true,
    sizes: ["N/A"],
    colors: ["N/A"],
    materials: ["Service"],
    is_custom: false,
    lead_time: "1 week",
  },

  // Alteration Services
  {
    brand_id: TEST_BRAND_ID,
    title: "Dress Alterations",
    description: "Professional alterations for perfect fit",
    price: 350,
    sale_price: null,
    category: "alteration",
    in_stock: true,
    sizes: ["All Sizes"],
    colors: ["N/A"],
    materials: ["Various"],
    is_custom: false,
    lead_time: "1-2 weeks",
  },
  {
    brand_id: TEST_BRAND_ID,
    title: "Suit Tailored",
    description: "Expert suit tailoring and fitting services",
    price: 450,
    sale_price: null,
    category: "alteration",
    in_stock: true,
    sizes: ["All Sizes"],
    colors: ["N/A"],
    materials: ["Various"],
    is_custom: false,
    lead_time: "2-3 weeks",
  },
];

async function addSampleProducts() {
  console.log("🛍️ Adding Sample Products to Test Brand");
  console.log("=".repeat(60));

  try {
    // Check if brand exists
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name")
      .eq("id", TEST_BRAND_ID)
      .single();

    if (brandError || !brand) {
      console.error("❌ Test brand not found:", TEST_BRAND_ID);
      console.log("💡 Please create the test brand first");
      return;
    }

    console.log(`✅ Found brand: ${brand.name}`);

    // Clear existing products for this brand
    console.log("\n🧹 Clearing existing products...");
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("brand_id", TEST_BRAND_ID);

    if (deleteError) {
      console.error("⚠️ Error clearing existing products:", deleteError);
    } else {
      console.log("✅ Existing products cleared");
    }

    // Add sample products
    console.log("\n📦 Adding sample products...");
    const { data: products, error: insertError } = await supabase
      .from("products")
      .insert(sampleProducts)
      .select();

    if (insertError) {
      console.error("❌ Error adding products:", insertError);
      return;
    }

    console.log(`✅ Successfully added ${products.length} products!`);

    // Display summary statistics
    console.log("\n📊 Product Summary:");
    const categories = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});

    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} products`);
    });

    const prices = products.map((p) => p.sale_price || p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice =
      prices.reduce((sum, price) => sum + price, 0) / prices.length;

    console.log("\n💰 Pricing Statistics:");
    console.log(`   Price Range: $${minPrice} - $${maxPrice}`);
    console.log(`   Average Price: $${Math.round(avgPrice)}`);

    const customProducts = products.filter((p) => p.is_custom);
    const readyProducts = products.filter((p) => !p.is_custom);

    if (customProducts.length > 0) {
      const customAvg =
        customProducts.reduce((sum, p) => sum + (p.sale_price || p.price), 0) /
        customProducts.length;
      console.log(`   Custom Average: $${Math.round(customAvg)}`);
    }

    if (readyProducts.length > 0) {
      const readyAvg =
        readyProducts.reduce((sum, p) => sum + (p.sale_price || p.price), 0) /
        readyProducts.length;
      console.log(`   Ready-to-Wear Average: $${Math.round(readyAvg)}`);
    }

    console.log("\n🎉 Sample products added successfully!");
    console.log("\n💡 Now you can test the enhanced revenue estimation system");
    console.log("   with real product pricing data.");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the script
addSampleProducts();
