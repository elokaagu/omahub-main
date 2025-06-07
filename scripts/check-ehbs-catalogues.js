const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEhbsCatalogues() {
  try {
    console.log("🔍 Checking EHBS Couture catalogues and brand relationships");

    // 1. Check EHBS Couture brand
    console.log("\n1️⃣ Finding EHBS Couture brand...");
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, category, location")
      .ilike("name", "%ehbs%");

    if (brandsError) {
      console.error("❌ Error finding brands:", brandsError);
      return;
    }

    console.log("✅ Found brands:", brands);

    const ehbsBrand = brands.find(
      (brand) =>
        brand.name.toLowerCase().includes("ehbs") &&
        brand.name.toLowerCase().includes("couture")
    );

    if (!ehbsBrand) {
      console.error("❌ EHBS Couture brand not found");
      return;
    }

    console.log(
      `✅ Found EHBS Couture: ${ehbsBrand.name} (ID: ${ehbsBrand.id})`
    );

    // 2. Check catalogues for EHBS Couture
    console.log("\n2️⃣ Checking catalogues for EHBS Couture...");
    const { data: catalogues, error: cataloguesError } = await supabase
      .from("catalogues")
      .select("*")
      .eq("brand_id", ehbsBrand.id);

    if (cataloguesError) {
      console.error("❌ Error fetching catalogues:", cataloguesError);
      return;
    }

    console.log(`📚 Found ${catalogues.length} catalogues for EHBS Couture:`);
    catalogues.forEach((catalogue, index) => {
      console.log(`  ${index + 1}. ${catalogue.title} (ID: ${catalogue.id})`);
      console.log(
        `     Created: ${new Date(catalogue.created_at).toLocaleDateString()}`
      );
      console.log(`     Status: ${catalogue.status || "N/A"}`);
    });

    // 3. Check user profile for eloka@culturin.com
    console.log("\n3️⃣ Checking user profile for eloka@culturin.com...");
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, email, role, owned_brands")
      .eq("email", "eloka@culturin.com")
      .single();

    if (userError) {
      console.error("❌ User error:", userError);
      return;
    }

    console.log("👤 User profile:", {
      email: user.email,
      role: user.role,
      owned_brands: user.owned_brands,
    });

    // 4. Verify brand ownership
    console.log("\n4️⃣ Verifying brand ownership...");
    const ownsEhbs =
      user.owned_brands && user.owned_brands.includes(ehbsBrand.id);
    console.log(`✅ User owns EHBS Couture: ${ownsEhbs ? "YES" : "NO"}`);

    // 5. Check products for EHBS Couture
    console.log("\n5️⃣ Checking products for EHBS Couture...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, brand_id")
      .eq("brand_id", ehbsBrand.id);

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      console.log("🔍 Trying alternative product query...");

      // Try with different column names
      const { data: altProducts, error: altError } = await supabase
        .from("products")
        .select("*")
        .eq("brand_id", ehbsBrand.id)
        .limit(5);

      if (altError) {
        console.error("❌ Alternative query also failed:", altError);
        console.log(
          "📝 Products data may not be available or table structure differs"
        );
      } else {
        console.log(
          `🛍️ Found ${altProducts?.length || 0} products for EHBS Couture (alt query)`
        );
        if (altProducts && altProducts.length > 0) {
          console.log(
            "📋 Sample product structure:",
            Object.keys(altProducts[0])
          );
        }
      }
    } else {
      console.log(
        `🛍️ Found ${products?.length || 0} products for EHBS Couture:`
      );
      if (products) {
        products.forEach((product, index) => {
          console.log(
            `  ${index + 1}. ${product.title || product.name || "Unnamed"} (ID: ${product.id})`
          );
        });
      }
    }

    console.log("\n🎉 Brand relationship check complete!");

    if (ownsEhbs) {
      console.log(
        "✅ eloka@culturin.com should see EHBS Couture in 'Your Brands'"
      );
      console.log(
        `✅ Should see ${catalogues.length} catalogues in 'Your Catalogues'`
      );
      const productCount = products?.length || 0;
      console.log(`✅ Should see ${productCount} products in 'Your Products'`);
    } else {
      console.log("❌ Brand ownership issue detected!");
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkEhbsCatalogues();
